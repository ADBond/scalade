import { Card } from "../game/card";
import { GameStateForUI } from "../game/gamestate";
import { renderWithDelays } from "./render";
import { getGame } from "./game";

export function playCard(state: GameStateForUI, card: Card): void {
    const game = getGame();
    game.state.playCard(card);
}

export async function onHumanPlay(state: GameStateForUI, card: Card) {
    console.log("Now the human plays!");
    playCard(state, card);
    const futureStates = await playUntilHuman();
    await renderWithDelays(futureStates, 500);
}

export async function playUntilHuman(): Promise<GameStateForUI[]> {
    console.log("Play til a human does");
    let game = getGame();
    let current = game.getGameStateForUI();
    const states: GameStateForUI[] = [current];

    // getout for infinite loop
    let counter = 0;
    // TODO: check game end
    while (((current.game_state !== "playCard") || !(current.whose_turn === "player")) && counter < 50) {
        console.log(current);
        game = getGame()
        await game.incrementState();
        current = game.getGameStateForUI();
        states.push(current);
        counter++;
    }

    return states;
}
