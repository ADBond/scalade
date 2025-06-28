import { Card } from "./card";
import { Agent } from "./agent/agent";

export const playerNameArr = ['player', 'comp1', 'comp2'] as const;
export type PlayerName = typeof playerNameArr[number];
export type LadderPosition = PlayerName | 'neutral';

export class Player {
    constructor(
        public displayName: string,
        public name: PlayerName,
        public hand: Card[],
        public score: number,
        public agent: Agent,
    ) { }
}
