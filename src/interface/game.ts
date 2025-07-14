import { Game } from "../game/game";

let game: Game;

export function newGame(): void {
    game = new Game(['Andy', 'Randy1', 'Randy2']);
}

export function getGame(): Game {
    if (!game) console.log("Error getting game! None found!");
    return game;
}
