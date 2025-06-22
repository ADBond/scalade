export type Suit = 'S' | 'H' | 'C' | 'D';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';
export type Card = `${Rank}${Suit}`;


// export interface GameState {
//   hands: Record<PlayerName, Card[]>;
//   played: Record<PlayerName, Card | null>;
//   previous: Record<PlayerName, Card | null>;
//   holding_bonus: Record<PlayerName, Record<Suit, number>>;
//   ladder: Record<PlayerName, Card[]>;
//   penultimate: Card[];
//   dead: Card[];
//   scores: Record<PlayerName, number>;
//   scores_previous: Record<PlayerName, number>;
//   score_details: ScoreDetails;
//   escalations: number;
//   hand_number: number;
//   trumps: Suit;
//   advance: Suit;
//   game_state: 'play_card' | 'trick_complete' | 'hand_complete';
//   whose_turn: 'human' | 'comp1' | 'comp2';
// }
