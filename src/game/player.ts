import { Card } from "./card";
import { Agent } from "./agent/agent";

export type PlayerName = 'player' | 'comp1' | 'comp2';
export type LadderPosition = PlayerName | 'neutral';

export class Player {
    constructor(
        public displayName: string,
        public name: PlayerName,
        public hand: Card[],
        score: number,
        // TODO: best way to handle humans?
        agent: Agent,
    ) { }
}
