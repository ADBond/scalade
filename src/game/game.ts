import { Pack } from './pack';
import { GameState, GameStateForUI, GameMode } from './gamestate';

export class Game {
  private pack = new Pack();
  public state: GameState;

  constructor(playerNames: string[], gameMode: GameMode = 'standard') {
    this.state = new GameState(playerNames, gameMode=gameMode);
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
