import { Pack } from './pack';
import { GameState, GameStateForUI, GameConfig } from './gamestate';
import { AgentName } from './agent/agent';
import { GameLog, sendGameLog } from './log';

function randomID(): string {
  const theDate = new Date();
  const dateString = [
    theDate.getFullYear(),
    String(theDate.getMonth() + 1).padStart(2, "0"),
    String(theDate.getDate()).padStart(2, "0"),
  ].join("_");
  const randomFromTime = (Date.now() % 100_000).toString(36);
  const randomNumber = Math.random().toString(36).slice(2, 8);
  return `${dateString}_${randomFromTime}_${randomNumber}`;
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
  private gameID: string;

  constructor(
      playerNames: AgentName[],
      config: GameConfig = defaultConfig,
      private simulation: boolean = false,
    ) {
    this.gameID = randomID();
    this.state = new GameState(playerNames, config);
    this.currentLog = new GameLog(this.gameID, config, this.simulation);
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
    console.log(this.currentLog);
    if (this.currentLog.complete) {
      this.logs.push(this.currentLog);
      if (this.simulation) {
        sendGameLog(this.currentLog);
      }
      this.currentLog = new GameLog(this.gameID, this.state.config, this.simulation);
    }
    // console.log(this.jsonLogs);
  }

}
