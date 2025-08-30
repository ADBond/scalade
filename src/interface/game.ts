import { Game } from "../game/game";
import { GameConfig } from "../game/gamestate";

let game: Game;

export function newGame(config: GameConfig): void {
    // TODO: use names for display, overriding comp1 comp2 etc which should be internal
    game = new Game(['Andy', 'Randy1', 'Randy2'], config);
}

export function getGame(): Game {
    if (!game) console.log("Error getting game! None found!");
    return game;
}
