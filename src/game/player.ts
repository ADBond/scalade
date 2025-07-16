import { Card, Suit, SUITS } from "./card";
import { Agent } from "./agent/agent";
import { ScoreBreakdown } from "./scores";

export const playerNameArr = ['player', 'comp1', 'comp2'] as const;
export type PlayerName = typeof playerNameArr[number];
export type LadderPosition = PlayerName | 'neutral';

class HoldingMultipliers {
    private holdingMultiplierArray: [Suit, number][]

    constructor() {
        this.holdingMultiplierArray = SUITS.map(
            (suit) => {
                return [suit, 1];
            }
        )
    }

    set(suit: Suit, multiplier: number) {
        this.holdingMultiplierArray = this.holdingMultiplierArray.map(
            ([holdingSuit, holdingMultiplier]) => {
                return [holdingSuit, Suit.suitEquals(suit, holdingSuit) ? multiplier: holdingMultiplier];
            }
        )
    }

    increment(suit: Suit) {
        this.set(suit, this.get(suit) + 1);
    }

    get(suit: Suit): number {
        return this.holdingMultiplierArray.filter(
            ([holdingSuit, holdingMultiplier]) => Suit.suitEquals(suit, holdingSuit)
        )[0][1];
    }
}

export class Player {
    constructor(
        public displayName: string,
        public name: PlayerName,
        public agent: Agent,
        public positionIndex: number,
        public hand: Card[] = [],
        public scores: ScoreBreakdown[] = [],
        public holdingMultipliers: HoldingMultipliers = new HoldingMultipliers(),
    ) { }

    get score(): number {
        return this.scores.map(
            (breakdown) => breakdown.score
        ).reduce(
            (total, value) => total + value
        );
    }

    get previousScore(): ScoreBreakdown {
        return this.scores[this.scores.length - 1];
    }
}
