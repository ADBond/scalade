import { Card, Suit } from "./card";
import { Player } from "./player";

export class GameLog {
    // snapshots of all ladders, from before first trick to after last
    // number is player index 0-2, fixed
    // 0 is human player
    // TODO: sort ladders
    private ladders: [Card, number | null][][] = [];
    // TODO: sort hands
    public hands: Card[][] = [];
    public grounding: Card[] = [];
    public spoils: Card[] = [];
    public deads: Card[] = [];
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

    constructor() {}

    captureLadders(ladders: [Card, Player | null][]) {
        this.ladders.push(
            ladders
                .map(([card, player]) => [card, player?.positionIndex ?? null])
        );
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

    // TODO: to json
    get json(): string {
        return JSON.stringify(this);
    }
    // TODO: to html (for display)
    // TODO: to bgg (for pretty copy/paste)
}
