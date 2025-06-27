import { Card, Suit } from './card';
import { Pack } from './pack';
import { LadderPosition, Player, PlayerName } from './player';
import { Agent } from './agent/agent';
import { randomAgent } from './agent/random';

type state = 'initialiseGame' | 'playCard' | 'trickComplete' | 'handComplete' | 'gameComplete';

export class GameState {
  public players: Player[] = [];
  public pack: Pack = new Pack();
  public dealerIndex: number;
  public currentPlayerIndex: number;
  public trickWinnerPlayerIndex: number;
  public finalTrickWinnerIndex: number;
  public cardsPerHand: number = 12;  // TODO: dynamic
  public trickIndex: number;
  public trickInProgress: Card[] = [];  // TODO: more info?
  public ladders: [Card, Player | null][] = this.getStartingLadders();
  public trumpSuit: Suit | null = null;
  public currentState: state = 'initialiseGame';

  constructor(public playerNames: string[]) {
    // TODO: more / flexi ??
    const playerConfig: PlayerName[] = ['player', 'comp1', 'comp2'];
    const agents: Agent[] = ['human', randomAgent, randomAgent]
    this.players = playerNames.map(
      (name, i) => new Player(name, playerConfig[i], [], 0, agents[i])
    )
    for (const name of playerNames) {
      this.players.push();
    }
    this.dealerIndex = 0;
    this.currentPlayerIndex = 0;
    this.trickIndex = 0;
    this.trickWinnerPlayerIndex = -1;
    this.finalTrickWinnerIndex = -1;
  }

  public increment() {
    switch (this.currentState) {
      case 'initialiseGame':
        this.dealCards(this.pack);
        this.currentState = 'playCard';
        break;
      case 'playCard':
        break;
      case 'trickComplete':
        this.resetTrick();
        break;
      case 'handComplete':
        break;
      case 'gameComplete':
        break;
      default:
        // error!
    }
  }

  getStartingLadders(): [Card, Player | null][] {
    return ["5D", "6H", "7S", "8C"].map(
      (card_str => [this.pack.getCard(card_str), null])
    );
  }

  get ladderCards(): Card[] {
    return this.ladders.map(
      ([card, _player]) => card
    )
  }

  trumpSuitFromLadders(): Suit {
    // find the lowest-ranked cards, as relates to trick-taking power
    const ladderCards = this.ladderCards;
    const lowestRung = Math.min(...ladderCards.map(card => card.rank.trickTakingRank));
    const minRungs = ladderCards.filter(card => card.rank.trickTakingRank == lowestRung);
    // if there's only one, that sets trumps
    if (minRungs.length == 1) {
      return minRungs[0].suit;
    }
    // if there's more than one, find their suit-ranking for setting trumps
    const maxSuit = Math.max(...ladderCards.map(card => card.suit.rankForTrumpPreference));
    const maxSuitCards = ladderCards.filter(card => card.suit.rankForTrumpPreference == maxSuit);
    // these should be distinct, so we only have one that is maximal, for a given rank
    if (maxSuitCards.length == 1){
      return maxSuitCards[0].suit;
    }
    // this would indicate an illegal pack, or error in filtering, or something
    throw new Error("Error determining trump suit");
  }

  private updateLadders() {
    // TODO: stub
  }

  get isPenultimateTrick(): boolean {
    return this.trickIndex == (this.cardsPerHand - 2);
  }

  get isFinalTrick(): boolean {
    return this.trickIndex == (this.cardsPerHand - 1);
  }

  private resetTrick() {
    // set trick winner as new current player
    const winnerPlayerIndex = this.trickWinnerPlayerIndex;
    this.currentPlayerIndex = winnerPlayerIndex;
    this.updateLadders();
    //if this was the final trick, we need to record the winner, for scoring
    if (this.isFinalTrick) {
      this.finalTrickWinnerIndex = winnerPlayerIndex;
    }
    // current trick info -> previous trick
    // if self.game_state_for_ui is not None:
    //     self.game_state_for_ui.prev_trick = self.trick_in_progress
    //     if self.leader_index is None:
    //         raise ValueError("Should have a leader")
    //     self.game_state_for_ui.prev_trick_leader_index = self.leader_index
    // # empty the trick, and increment the counter!
    this.trickInProgress = [];
    this.trickIndex++;
    // if self.hand_not_finished:
    //     self.current_state = "play_card"
    // else:
    //     self.current_state = "hand_complete"
    // return
  }

  private dealCards(pack: Pack, count: number = 12) {
    const remainingPack = this.pack.filterOut(this.ladderCards);
    Pack.shuffle(remainingPack);
    for (let i = 0; i < count; i++) {
      // for (const player of this.state.players) {
        // TODO: loop this properly!
      for (let playerIndex = 0; playerIndex < 3; playerIndex++) {
        const card = remainingPack.pop();
        if (card) this.giveCardToPlayer(playerIndex, card);
      }
    }
    this.trumpSuit = this.trumpSuitFromLadders();
  }

  giveCardToPlayer(playerIndex: number, card: Card) {
    this.players[playerIndex].hand.push(card);
  }

  getPlayerHand(playerIndex: number): Card[] {
    return this.players[playerIndex].hand ?? [];
  }

  playCard(playerIndex: number, card: Card): boolean {
    const hand = this.getPlayerHand(playerIndex);
    if (!hand) return false;

    const index = hand.findIndex(
      c => c.rank === card.rank && c.suit === card.suit
    );
    if (index >= 0) {
      const [playedCard] = hand.splice(index, 1);
    //   this.pile.push(playedCard);
      return true;
    }
    return false;
  }

  getStateForUI(): GameStateForUI {
    return {
      // TODO: probably only need one hand, don't fix index
      hands: {comp1: this.getPlayerHand(1), player: this.getPlayerHand(0), comp2: this.getPlayerHand(2)},
      trumps: this.trumpSuit,
      // TODO: placeholders:
      played: {comp1: null, player: null, comp2: null},
      previous: {comp1: null, player: null, comp2: null},
      ladder: {
        comp1: [], player: [], comp2: [],
        // TODO: something similar for the players
        neutral: this.ladders.filter(([_card, player]) => player === null).map(([card, _player]) => card)
      },
      scores: {comp1: 0, player: 0, comp2: 0},
      scores_previous: {comp1: 0, player: 0, comp2: 0},
      score_details: {},
      holding_bonus: {comp1: {}, player: {}, comp2: {}},
      dead: [],
      penultimate: [],
      escalations: -1,
      hand_number: -1,
      advance: "C",
      game_state: "play_card",
      whose_turn: "human",
    }
  }
}

export interface ScoreDetails {
  [player: string]: {
    ladder_bonuses: Record<string, { rank_base_value: number; holding_bonus_multiplier: number }>;
    final_trick_bonus: number;
  };
}


export interface GameStateForUI {
  hands: Record<PlayerName, Card[]>;
  played: Record<PlayerName, Card | null>;
  previous: Record<PlayerName, Card | null>;
  holding_bonus: Record<PlayerName, Record<string, number>>;
  ladder: Record<LadderPosition, Card[]>;
  penultimate: Card[];
  dead: Card[];
  scores: Record<PlayerName, number>;
  scores_previous: Record<PlayerName, number>;
  score_details: ScoreDetails;
  escalations: number;
  hand_number: number;
  // TODO: suits:
  trumps: Suit | null;
  advance: string;
  game_state: 'play_card' | 'trick_complete' | 'hand_complete';
  whose_turn: 'human' | 'comp1' | 'comp2';
}
