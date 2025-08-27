import { Card } from "./card";
import { Player } from "./player";

export class GameLog {
    // snapshots of all ladders, from before first trick to after last
    private ladders: [Card, Player | null][][] = [];
    private grounding: Card[] = [];
    private spoils: Card[] = [];
    private deads: Card[] = [];
    // TODO: generalise this if we ever generalise count in app
    private playerCount: number = 3;
    // human player (1-3), 1 being eldest, 3 being dealer
    private humanPosition: number;
    // lead player offset (1-3), and the cards played
    private tricks: [number, Card[]][] = [];


    constructor(humanPosition: number) {
        this.humanPosition = humanPosition;
    }

    // TODO: to json
    // TODO: to html (for display)
    // TODO: to bgg (for pretty copy/paste)
}
