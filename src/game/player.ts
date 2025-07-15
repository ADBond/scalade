import { Card } from "./card";
import { Agent } from "./agent/agent";
import { ScoreBreakdown } from "./scores";

export const playerNameArr = ['player', 'comp1', 'comp2'] as const;
export type PlayerName = typeof playerNameArr[number];
export type LadderPosition = PlayerName | 'neutral';

export class Player {
    constructor(
        public displayName: string,
        public name: PlayerName,
        public hand: Card[],
        public scores: ScoreBreakdown[] = [],
        public agent: Agent,
        public positionIndex: number,
    ) { }

    get score(): number {
        return this.scores.map(
            (breakdown) => breakdown.score
        ).reduce(
            (total, value) => total + value
        );
    }
}
