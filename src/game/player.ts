import { Card } from "./card";

export type PlayerName = 'player' | 'comp1' | 'comp2' | 'neutral';

export class Player {
    constructor(public displayName: string, public name: PlayerName, public hand: Card[], score: number) { }
    // TODO: action!
}
