import { Game } from "../game/game";
import { GameMode, BonusCapping } from "../game/gamestate";

let game: Game;

export function newGame(gameMode: GameMode, escalations: number, capping: BonusCapping): void {
    // TODO: use names for display, overriding comp1 comp2 etc which should be internal
    game = new Game(['Andy', 'Randy1', 'Randy2'], gameMode, escalations, capping);
}

export function getGame(): Game {
    if (!game) console.log("Error getting game! None found!");
    return game;
}
