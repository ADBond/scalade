import * as tf from '@tensorflow/tfjs';

import { Card, N_SUITS, SUITS } from './card';
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

const CurrentTrickEncoder: Encoder = {
    encode: (gameState: GameState) => {
        const numPlayers = gameState.numPlayers;
        const currentTrick = gameState.trickInProgressCards;
        const encodedCards = Array.from({ length: numPlayers - 1 }, (_, i) => {
            return currentTrick[i] !== undefined ? [currentTrick[i]] : [];
        }).map(
            (cards) => encodeCards(cards, gameState.pack.getFullPack().length)
        );

        return tf.concat(encodedCards);
    }
}

const UnseenCardsEncoder: Encoder = {
    // Flawed encoder, but need it to match with trained model
    // Should take into account hand as well explicitly
    encode: (gameState: GameState) => {
        const pack = gameState.pack.getFullPack();
        const unseenCards = pack.filter(
            // all cards in pack that are not in publicCards
            (card) => gameState.publicCards.filter(
                (publicCard) => Card.cardEquals(card, publicCard)
            ).length === 0
        )
        return encodeCards(unseenCards, pack.length);
    }
}

const opponentVoidsEncoder: Encoder = {
    encode: (gameState: GameState) => {
        const currentPlayerIndex = gameState.currentPlayerIndex;
        const nextPlayerIndex = gameState.getNextPlayerIndex(currentPlayerIndex);
        const prevPlayerIndex = gameState.getNextPlayerIndex(nextPlayerIndex);
        const encodedRenounces = [nextPlayerIndex, prevPlayerIndex].map(
            (playerIndex) => {
                return oneHotEncode([...gameState.renounces[playerIndex]], N_SUITS)
            }
        )
        return tf.concat(encodedRenounces);
    }
}

const LaddersEncoder: Encoder = {
    encode: (gameState: GameState) => {
        const playerIndex = gameState.currentPlayerIndex;
        const nextPlayerIndex = gameState.getNextPlayerIndex(playerIndex);
        const prevPlayerIndex = gameState.getNextPlayerIndex(nextPlayerIndex);
        const ladders = gameState.ladders;

        const encodedCards = [
            playerIndex,
            nextPlayerIndex,
            prevPlayerIndex,
        ].map(
            (index) => encodeCards(
                ladders.filter(
                    ([_card, player]) => player?.positionIndex === index
                ).map(
                    ([card, _player]) => card
                ),
                gameState.pack.getFullPack().length
            )
        )
    
        return tf.concat(encodedCards);
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

const HoldingBonusEncoder: Encoder = {
    encode: (gameState: GameState) => {
        const currentPlayerIndex = gameState.currentPlayerIndex;
        const nextPlayerIndex = gameState.getNextPlayerIndex(currentPlayerIndex);
        const prevPlayerIndex = gameState.getNextPlayerIndex(nextPlayerIndex);
        const encodedHoldingBonuses = [currentPlayerIndex, nextPlayerIndex, prevPlayerIndex].map(
            (playerIndex) => {
                const player = gameState.players[playerIndex];
                const holdingBonusArray = Array(N_SUITS).fill(0);
                SUITS.forEach((suit) => {
                    holdingBonusArray[suit.rankForTrumpPreference] = player.holdingMultipliers.get(suit);
                });
                const encodedHoldingBonus = tf.tensor1d(holdingBonusArray);
                return encodedHoldingBonus;
            }
        )
        return tf.concat(encodedHoldingBonuses);
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
    currentTrick: CurrentTrickEncoder,
    unseenCards: UnseenCardsEncoder,
    opponentVoids: opponentVoidsEncoder,
    ladders: LaddersEncoder,
    trickNumber: TrickNumberEncoder,
    playingLast: PlayingLastEncoder,
    holdingBonus: HoldingBonusEncoder,
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
        "currentTrick",
        "playingLast",
        "unseenCards",
        "ladders",
        "holdingBonus",
        "trickNumber",
        "trumpSuit",
        "ledSuit",
        // not all voids - only renounces. No deductions!
        "opponentVoids",
    ]
).encoder;
