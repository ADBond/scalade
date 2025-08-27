import { Pack } from './pack';
import { GameState, GameStateForUI, GameMode, BonusCapping } from './gamestate';
import { GameLog } from './log';

export class Game {
  private pack = new Pack();
  public state: GameState;
  public logs: GameLog[] = [];

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

  get jsonLogs(): string {
    return "";
  }

  async incrementState() {
    await this.state.increment();
  }

}
