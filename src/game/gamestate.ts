import { Card, Suit } from './card';
import { Pack } from './pack';
import { LadderPosition, Player, PlayerName } from './player';
import { randomAgent } from './agent/random';

export class GameState {
  public players: Player[] = [];
  public pack: Pack = new Pack();
  public dealerIndex: number;
  public currentPlayerIndex: number;
  public ladders: [Card, Player | null][] = this.getStartingLadders();
  public trumpSuit: Suit | null = null;

  constructor(public playerNames: string[]) {
    for (const name of playerNames) {
      this.players.push(new Player(name, 'player', [], 0, randomAgent));
    }
    this.dealerIndex = 0;
    this.currentPlayerIndex = 0;
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
