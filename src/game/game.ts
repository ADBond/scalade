import { Pack } from './pack';
import { GameState, GameStateForUI } from './gamestate';
import { Card } from './card';

export class Game {
  private pack = new Pack();
  private state: GameState;

  constructor(playerNames: string[]) {
    this.state = new GameState(playerNames);
    this.state.increment();
  }

  getGameState(): GameState {
    return this.state;
  }

  getGameStateForUI(): GameStateForUI {
    return this.state.getStateForUI();
  }

  playCard(player: string, card: Card): boolean {
    // return this.state.playCard(player, card);
    return true;
  }
}
