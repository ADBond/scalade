import { Pack } from './pack';
import { GameState, GameStateForUI, GameConfig } from './gamestate';
import { GameLog, sendGameLog } from './log';

// TODO: this is just a placeholder for temp scaffolding
function randomID(): number {
  return Math.floor((Math.random() * 1000000) + 1);
}

const defaultConfig: GameConfig = {
  trumpRule: 'mobile',
  escalations: 2,
  capping: 'uncapped',
}

export class Game {
  private pack = new Pack();
  public state: GameState;
  public logs: GameLog[] = [];
  private currentLog: GameLog;
  private gameID: number;

  constructor(
      playerNames: string[],
      config: GameConfig = defaultConfig,
    ) {
    this.gameID = randomID();
    this.state = new GameState(playerNames, config);
    this.currentLog = new GameLog(this.gameID);
    this.incrementState();
  }

  getGameState(): GameState {
    return this.state;
  }

  getGameStateForUI(): GameStateForUI {
    return this.state.getStateForUI();
  }

  get jsonLogs(): string {
    return JSON.stringify(this.logs);
  }

  async incrementState() {
    await this.state.increment(this.currentLog);
    if (this.currentLog.complete) {
      this.logs.push(this.currentLog);
      sendGameLog(this.currentLog);
      this.currentLog = new GameLog(this.gameID);
    }
    console.log(this.jsonLogs);
  }

}
