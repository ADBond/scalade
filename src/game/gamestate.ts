import { Card } from './card';
import { Pack } from './pack';
import { LadderPosition, Player, PlayerName } from './player';

export class GameState {
  public players: Player[] = [];
  public pack: Pack = new Pack();
  public dealerIndex: number;
  public currentPlayerIndex: number;
  public ladders: [Card, Player | null][] = this.getStartingLadders();

  constructor(public playerNames: string[]) {
    for (const name of playerNames) {
      this.players.push(new Player(name, 'player', [], 0));
    }
    this.dealerIndex = 0;
    this.currentPlayerIndex = 0;
  }

  getStartingLadders(): [Card, Player | null][] {
    return ["5D", "6H", "7S", "8C"].map(
      (card_str => [this.pack.getCard(card_str), null])
    );
  }

  get ladder_cards(): Card[] {
    return this.ladders.map(
      ([card, _player]) => card
    )
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
      trumps: "S",
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
  trumps: string;
  advance: string;
  game_state: 'play_card' | 'trick_complete' | 'hand_complete';
  whose_turn: 'human' | 'comp1' | 'comp2';
}
