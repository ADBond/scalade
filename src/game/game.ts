import { Pack } from './pack';
import { GameState, GameStateForUI, GameMode, BonusCapping } from './gamestate';

export class Game {
  private pack = new Pack();
  public state: GameState;

  constructor(playerNames: string[], gameMode: GameMode = 'mobile', escalations: number = 2, capping: BonusCapping = 'uncapped') {
    this.state = new GameState(playerNames, gameMode=gameMode, escalations, capping);
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

}
