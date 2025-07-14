import * as tf from '@tensorflow/tfjs';

import { Card, N_SUITS } from './card';
import { GameState } from "./gamestate";

function oneHotEncode(index: number | number[] | null | undefined, size: number): tf.Tensor {
    if ((index === null) || (index === undefined)) {
        return tf.fill([size], 0);
    }
    const indices = Array.isArray(index) ? index : [index];
    const encoded = tf.fill([size], -1);
    const indexTensor = tf.tensor2d(
        indices.map(
            (ind) => {return [ind]}
        ),
        [indices.length, 1],
        "int32",
    );
    const updates = tf.ones([indices.length]);
    return tf.tensorScatterUpdate(encoded, indexTensor, updates);
}

function encodeCards(cards: Card[], packSize: number): tf.Tensor {
    return oneHotEncode(
        cards.map(
            (card) => {
                return card.index;
            }
        ),
        packSize,
    )
}

export interface Encoder {
    encode: (gameState: GameState) => tf.Tensor
}

const HandEncoder: Encoder = {
    encode: (gameState: GameState) => {
        // TODO: helper in pack for straightforward size
        return encodeCards(gameState.humanHand, gameState.pack.getFullPack().length);
    }
}

const TrickNumberEncoder: Encoder = {
    encode: (gameState: GameState) => {
        return oneHotEncode(gameState.trickIndex, gameState.cardsPerHand);
    }
}

const PlayingLastEncoder: Encoder = {
    encode: (gameState: GameState) => {
        const value = gameState.trickInProgress.length === gameState.numPlayers - 1 ? 1 : 0;
        return tf.fill([1], value);
    }
}

const LedSuitEncoder: Encoder = {
    encode: (gameState: GameState) => {
        return oneHotEncode(gameState.currentLedSuit?.rankForTrumpPreference, N_SUITS);
    }
}

const TrumpSuitEncoder: Encoder = {
    encode: (gameState: GameState) => {
        return oneHotEncode(gameState.trumpSuit?.rankForTrumpPreference, N_SUITS);
    }
}

const concreteEncoders = {
    hand: HandEncoder,
    trickNumber: TrickNumberEncoder,
    playingLast: PlayingLastEncoder,
    ledSuit: LedSuitEncoder,
    trumpSuit: TrumpSuitEncoder,
}
type concreteEncoderNames = keyof typeof concreteEncoders

export class ModelEncoder {
    constructor(public encoderNames: concreteEncoderNames[]) { }

    get encoder(): Encoder {
        const MultiEncoder: Encoder = {
            encode: (gameState: GameState) => {
                const encoded = this.encoderNames.map(
                    (name) => concreteEncoders[name].encode(gameState)
                );
                const fullEncoded = tf.concat(encoded);
                return fullEncoded.reshape([1, fullEncoded.shape[0]]);
            }
        }
        return MultiEncoder;
    }
}

export const smallEncoder = new ModelEncoder(["hand", "trickNumber", "trumpSuit", "ledSuit"]).encoder;
export const extendedEncoder = new ModelEncoder(
    [
        "hand",
        // "currentTrick",
        "playingLast",
        // "unseenCards",
        // "ladders",
        // "holdingBonus",
        "trickNumber",
        "trumpSuit",
        "ledSuit",
        // "opponentVoids",
    ]
).encoder;
