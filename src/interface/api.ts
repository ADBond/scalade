import { Card } from "../game/card";
import { GameStateForUI } from "../game/gamestate";
import { renderState } from "./render";

export function playCard(state: GameStateForUI, card: Card) {
    const newState = state.playCard(card);
    // renderState(newState);
    renderState(newState);
}