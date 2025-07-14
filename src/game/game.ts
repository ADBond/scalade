import { Pack } from './pack';
import { GameState, GameStateForUI } from './gamestate';

export class Game {
  private pack = new Pack();
  public state: GameState;

  constructor(playerNames: string[]) {
    this.state = new GameState(playerNames);
    this.incrementState();
  }

  getGameState(): GameState {
    return this.state;
  }

  getGameStateForUI(): GameStateForUI {
    return this.state.getStateForUI();
  }

  async incrementState() {
    await this.state.increment();
  }

  // playCard(player: string, card: Card): boolean {
  //   // return this.state.playCard(player, card);
  //   return true;
  // }
}
