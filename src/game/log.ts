import { Card, Suit } from "./card";
import { Player } from "./player";

declare const __COMMIT_HASH__: string;

export class GameLog {
    // snapshots of all ladders, from before first trick to after last
    // number is player index 0-2, fixed
    // 0 is human player
    // TODO: sort ladders
    private ladders: [Card, number | null][][] = [];
    private hands: Card[][] = [];
    private grounding: Card[] = [];
    private spoils: Card[] = [];
    private deads: Card[] = [];
    // TODO: generalise this if we ever generalise count in app
    private playerCount: number = 3;
    // this allows us to translate player index to position in hand
    public dealerIndex: number = -1;
    // each trick is array of [card, playerIndex], along with trump suit + winner index
    private tricks: [Suit, [Card, number][], number][] = [];
    // TODO: scores
    // TODO: game configuration
    // TODO: holding bonuses
    public complete: boolean = false;
    private version: string = __COMMIT_HASH__;

    constructor() {}

    captureLadders(ladders: [Card, Player | null][]) {
        const sortedLadders: [Card, number | null][] = ladders.map(
            ([card, player]) => {
                return [card, player?.positionIndex ?? null]
            }
        );
        sortedLadders.sort(
            (a, b) => {
                const [c1, c2] = [a[0], b[0]];
                return 100*(c1.suit.rankForTrumpPreference - c2.suit.rankForTrumpPreference) +
                    (c1.rank.trickTakingRank - c2.rank.trickTakingRank)
            }
        );
        this.ladders.push(sortedLadders);
    }

    captureTrick(trumpSuit: Suit, trick: [Card, Player][], winnerIndex: number) {
        this.tricks.push(
            [
                trumpSuit,
                trick.map(([card, player]) => [card, player.positionIndex]),
                winnerIndex,
            ]
        );
    }

    captureCrossCards(prop: 'grounding' | 'spoils' | 'deads', cards: Card[]) {
        this[prop] = [...cards].sort(
            (c1, c2) => (
              // 100 big enough to ensure we always sort by suit first
              // TODO: farm this out
              100*(c1.suit.rankForTrumpPreference - c2.suit.rankForTrumpPreference) +
              (c1.rank.trickTakingRank - c2.rank.trickTakingRank)
            )
          );
    }

    captureHands(hands: Card[][]) {
        this.hands = hands.map(
            (hand) => hand.sort(
                (c1, c2) => (
                    // 100 big enough to ensure we always sort by suit first
                    // TODO: farm this out
                    100*(c1.suit.rankForTrumpPreference - c2.suit.rankForTrumpPreference) +
                    (c1.rank.trickTakingRank - c2.rank.trickTakingRank)
                )
            )
        );
    }

    get json(): string {
        return JSON.stringify(this);
    }
    // TODO: to html (for display)
    // TODO: to bgg (for pretty copy/paste)
}
