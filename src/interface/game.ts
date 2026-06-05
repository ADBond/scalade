import { Game } from "../game/game";
import { GameConfig } from "../game/gamestate";

let game: Game;

export function newGame(config: GameConfig): void {
    game = new Game('ismcts1000', config);
}

export function getGame(): Game {
    if (!game) console.log("Error getting game! None found!");
    return game;
}
