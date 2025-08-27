import { Card } from "./card";
import { Player } from "./player";

export class GameLog {
    // snapshots of all ladders, from before first trick to after last
    private ladders: [Card, Player | null][][] = [];
    private hands: Card[][] = [];
    private grounding: Card[] = [];
    private spoils: Card[] = [];
    private deads: Card[] = [];
    // TODO: generalise this if we ever generalise count in app
    private playerCount: number = 3;
    // human player (0-2), 0 being eldest, 2 being dealer
    private humanPosition: number = -1;
    // lead player offset (0-2), and the cards played
    private tricks: [number, Card[]][] = [];
    public complete: boolean = false;

    constructor() {}

    // TODO: to json
    // TODO: to html (for display)
    // TODO: to bgg (for pretty copy/paste)
}
