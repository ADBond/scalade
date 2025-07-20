import { Game } from "../game/game";
import { GameMode } from "../game/gamestate";

let game: Game;

export function newGame(gameMode: GameMode): void {
    game = new Game(['Andy', 'Randy1', 'Randy2'], gameMode);
}

export function getGame(): Game {
    if (!game) console.log("Error getting game! None found!");
    return game;
}
