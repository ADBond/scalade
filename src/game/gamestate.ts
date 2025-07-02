import { Card, Suit, arbitrarySuit } from './card';
import { Pack } from './pack';
import { LadderPosition, Player, PlayerName, playerNameArr } from './player';
import { Agent } from './agent/agent';
import { randomAgent } from './agent/random';

type state = 'initialiseGame' | 'playCard' | 'trickComplete' | 'handComplete' | 'gameComplete';

export class GameState {
  public players: Player[] = [];
  public pack: Pack = new Pack();
  public dealerIndex: number;
  public currentPlayerIndex: number;
  public finalTrickWinnerIndex: number;
  public cardsPerHand: number = 12;  // TODO: dynamic
  public trickIndex: number;
  public trickInProgress: [Card, Player][] = [];
  public previousTrick: [Card, Player][] = [];
  public groundings: Card[] = [];
  public spoils: Card[] = [];
  public deadCards: Card[] = [];
  public ladders: [Card, Player | null][] = this.getStartingLadders();
  public trumpSuit: Suit = arbitrarySuit;
  public currentState: state = 'initialiseGame';
  public handNumber: number = 0;

  constructor(public playerNames: string[]) {
    // TODO: more / flexi ??
    const playerConfig: PlayerName[] = ['player', 'comp1', 'comp2'];
    const agents: Agent[] = ['human', randomAgent, randomAgent]
    this.players = playerNames.map(
      (name, i) => new Player(name, playerConfig[i], [], 0, agents[i], i)
    )
    for (const name of playerNames) {
      this.players.push();
    }
    this.dealerIndex = 0;
    this.currentPlayerIndex = 0;
    this.trickIndex = 0;
    this.finalTrickWinnerIndex = -1;
  }

  public increment() {
    const state = this.currentState;
    switch (state) {
      case 'initialiseGame':
        this.dealCards(this.pack);
        break;
      case 'playCard':
        const moveIndex = this.computerMove();
        break;
      case 'trickComplete':
        this.resetTrick();
        break;
      case 'handComplete':
        this.updateScores();
        this.dealerIndex = this.getNextPlayerIndex(this.dealerIndex);
        this.dealCards(this.pack);
        break;
      case 'gameComplete':
        break;
      default:
        // error!
    }
  }

  get trickInProgressCards(): Card[] {
    return this.trickInProgress.map(
      ([card, _player]) => card
    );
  }

  get currentLedSuit(): Suit | null {
    const trickInProgressCards = this.trickInProgressCards;
    if (trickInProgressCards.length === 0){
      return null;
    }
    return trickInProgressCards[0].suit;
  }

  get legalMoveIndices(): number[] {
    let legalCards: Card[];
    const hand = this.currentPlayerHand;
    const ledSuit = this.currentLedSuit;
    if (ledSuit === null) {
      // if there is no card led, anything is legal
      legalCards = hand;
    } else {
      // must follow suit if we can
      legalCards = hand.filter(card => Suit.suitEquals(card.suit, ledSuit));
      if (legalCards.length === 0) {
        // if we have no cards of led suit, anything is legal
        legalCards = hand;
      }
    }
    return legalCards.map(card => card.index);
  }

  private getPlayedCard(name: PlayerName, trick: [Card, Player][]): Card | null {
    const playerPlayedCards = trick.filter(
      ([_card, player]) => player.name === name
    );
    const numCards = playerPlayedCards.length;
    if (numCards === 1){
      return playerPlayedCards[0][0];
    }
    if (numCards > 1) {
      console.log(`getPlayedCard error: ${playerPlayedCards}`);
    }
    return null;
  }

  get currentPlayer(): Player {
    return this.players[this.currentPlayerIndex];
  }

  get currentPlayerHand(): Card[] {
    return this.currentPlayer.hand;
  }

  get numPlayers(): number {
    return this.players.length;
  }

  getNextPlayerIndex(playerIndex: number): number {
    return ((playerIndex + 1) % this.numPlayers);
  }

  get trickWinnerPlayer(): Player {
    const winningCardPlay = this.trickInProgress.filter(
      ([card, player]) => Card.cardEquals(card, this.winningCard)
    );
    // TODO: length check?
    const trickWinner = winningCardPlay[0][1];
    return trickWinner;
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
    const minRungs = ladderCards.filter(card => card.rank.trickTakingRank === lowestRung);
    // if there's only one, that sets trumps
    if (minRungs.length === 1) {
      return minRungs[0].suit;
    }
    // if there's more than one, find their suit-ranking for setting trumps
    const maxSuit = Math.max(...ladderCards.map(card => card.suit.rankForTrumpPreference));
    const maxSuitCards = ladderCards.filter(card => card.suit.rankForTrumpPreference === maxSuit);
    // these should be distinct, so we only have one that is maximal, for a given rank
    if (maxSuitCards.length === 1){
      return maxSuitCards[0].suit;
    }
    // this would indicate an illegal pack, or error in filtering, or something
    throw new Error("Error determining trump suit");
  }

  private incrementRungCount(suit: Suit) {
    // TODO: implement logic here, which ultimately triggers game end
  }

  private updateLadders(winningPlayer: Player) {
    let cardsToUpdateLaddersFrom = this.trickInProgressCards;
    // penultimate trick - we get the spoils:
    if (this.isPenultimateTrick) {
      cardsToUpdateLaddersFrom = cardsToUpdateLaddersFrom.concat(this.spoils);
    }

    // only these ladder cards will be affected
    // this can be 0-(number of players)
    // we process a single increment at a time, so that if we e.g. have 5,6,7
    // this will loop through rather than updating 5->7 in one go
    let affectedLadderCards: Card[];
    // TODO: think I've lost readability a bit here!
    while (
      (affectedLadderCards = this.ladderCards.filter(
            ladderCard => cardsToUpdateLaddersFrom.filter(
              updateCard => Card.cardEquals(updateCard, ladderCard.nextCardUp(this.pack.getFullPack()))
            ).length > 0
          )
        ).length > 0
      ) {
        // update the first ladder card, and then repeat
        let currentLadderCard = affectedLadderCards[0];
        // new ladder card is in trick_in_progress, if logic is consistent
        let newLadderCard = currentLadderCard.nextCardUp(this.pack.getFullPack());
        // remove old card from ladder, add new card
        this.ladders = this.ladders.filter(
          ([card, _player]) => !Card.cardEquals(card, currentLadderCard)
        );
        this.ladders.push([newLadderCard, winningPlayer]);
        // remove new card from trick-in-progress, add old card
        cardsToUpdateLaddersFrom = cardsToUpdateLaddersFrom.filter(
          (card) => !Card.cardEquals(card, newLadderCard)
        );
        cardsToUpdateLaddersFrom.push(currentLadderCard);
        this.incrementRungCount(currentLadderCard.suit);
    }
    return cardsToUpdateLaddersFrom;
  }

  get winningCard(): Card {
    const trumpCardsPlayed = this.trickInProgress.filter(
      ([card, _player]) => Suit.suitEquals(card.suit, this.trumpSuit)
    );
    let winningCard: Card;
    if (trumpCardsPlayed.length > 0) {
      winningCard = Card.singleHighestCard(trumpCardsPlayed.map(([card, _player]) => card));
    } else {
      const ledCardsPlayed = this.trickInProgress.filter(
        ([card, _player]) => Suit.suitEquals(card.suit, this.currentLedSuit as Suit)
      );
      winningCard = Card.singleHighestCard(ledCardsPlayed.map(([card, _player]) => card))
    }
    return winningCard;
  }

  get isPenultimateTrick(): boolean {
    return this.trickIndex === (this.cardsPerHand - 2);
  }

  get isFinalTrick(): boolean {
    return this.trickIndex === (this.cardsPerHand - 1);
  }

  get handNotFinished(): boolean {
    return this.players.map(
      (player) => player.hand
    ).some(
      (hand) => hand.length > 0
    );
  }

  private computerMove(): number {
    const agent = this.currentPlayer.agent;
    if (agent === 'human') {
      // TODO: error
      console.log("Error: trying to move for a human")
      return -20;
    }

    const currentLegalMoves = this.legalMoveIndices;
    const cardToPlayIndex = agent.chooseMove(this, currentLegalMoves);
    const cardToPlay = Card.cardFromIndex(cardToPlayIndex, this.pack.getFullPack())

    if (!this.playCard(cardToPlay)) {
      console.log("Error playing card");
    }
    return cardToPlayIndex;
  }

  private resetTrick() {
    // set trick winner as new current player
    const winnerPlayer = this.trickWinnerPlayer;
    this.currentPlayerIndex = winnerPlayer.positionIndex;
    this.updateLadders(winnerPlayer);
    //if this was the final trick, we need to record the winner, for scoring
    if (this.isFinalTrick) {
      this.finalTrickWinnerIndex = winnerPlayer.positionIndex;
    }
    // current trick info -> previous trick
    this.previousTrick = this.trickInProgress

    // empty the trick, and increment the counter!
    this.trickInProgress = [];
    this.trickIndex++;
    if (this.handNotFinished) {
      this.currentState = "playCard";
    } else {
      this.currentState = "handComplete";
    }
  }

  private dealCards(pack: Pack, count: number = 12) {
    const halfHandSizeRoundedUp = Math.ceil(count / 2);
    const remainingPack = this.pack.filterOut(this.ladderCards);
    Pack.shuffle(remainingPack);
    // first hand we have random groundings,
    if (this.handNumber == 0){
      // TODO: this logic can be pulled out!
      for (let i = 0; i < 2; i++) {
        const card = remainingPack.pop();
        if (card) this.groundings.push(card); else console.log("Deal error! ran out of cards before groundings");
      }
    }
    for (let i = 0; i < count; i++) {
      // for (const player of this.state.players) {
        // TODO: loop this properly!
      for (let playerIndex = 0; playerIndex < 3; playerIndex++) {
        const card = remainingPack.pop();
        if (card) this.giveCardToPlayer(playerIndex, card);
      }
      // after half (rounded up) the cards have been dealt, deal the dead cards
      if (i === halfHandSizeRoundedUp - 1) {
        this.deadCards = [];
        for (let j = 0; j < 2; j++) {
          const card = remainingPack.pop();
          if (card) this.deadCards.push(card); else console.log("Deal error! ran out of cards before deads");
        }
        for (let j = 0; j < 2; j++) {
          const card = this.groundings.pop();
          if (card) remainingPack.push(card); else console.log("Deal error! ran out of cards before shuffling groundings");
        }
        Pack.shuffle(remainingPack);
      }
    }
    this.spoils = []
    for (let i = 0; i < 2; i++) {
      const card = remainingPack.pop();
      if (card) this.spoils.push(card); else console.log("Deal error! ran out of cards before spoils");
    }
    // TODO now pack should be empty
    console.log("Empty pack:");
    console.log(remainingPack);
    this.trumpSuit = this.trumpSuitFromLadders();
    this.currentState = 'playCard';
    this.currentPlayerIndex = this.getNextPlayerIndex(this.dealerIndex);
    this.handNumber++;
  }

  giveCardToPlayer(playerIndex: number, card: Card) {
    this.players[playerIndex].hand.push(card);
  }

  getPlayerHand(playerIndex: number): Card[] {
    return this.players[playerIndex].hand ?? [];
  }

  playCard(card: Card): boolean {
    if (!this.legalMoveIndices.includes(card.index)){
      console.log(`Error: Cannot play illegal card ${card}`);
      return false;
    }
    const player = this.currentPlayer;
    const hand = player.hand;
    if (!hand) {
      console.log("Error: I couldn't find a hand!");
      return false;
    }

    const index = hand.findIndex(
      c => c.rank === card.rank && c.suit === card.suit
    );
    if (index < 0) {
      return false;
    }
    const [playedCard] = hand.splice(index, 1);
    this.trickInProgress.push([playedCard, player]);
    // TODO: do we need this anymore, with better player tracking?
    // if (this.trickInProgress.length === 1) {
    //   this.leaderIndex = this.currentPlayerIndex;
    // }
    if (this.trickInProgress.length === this.numPlayers) {
      this.currentState = "trickComplete";
      return true;
    }
    const newCurrentPlayerIndex = this.getNextPlayerIndex(this.currentPlayerIndex);
    this.currentPlayerIndex = newCurrentPlayerIndex;
    return true;
  }

  updateScores() {
    ;
  }

  getStateForUI(): GameStateForUI {
    return {
      // TODO: don't fix index of human player, maybe?
      hands: {comp1: [], player: this.getPlayerHand(0), comp2: []},
      trumps: this.trumpSuit,
      played: Object.fromEntries(
        playerNameArr.map((name): [PlayerName, Card | null] => [name, this.getPlayedCard(name, this.trickInProgress)])
      ) as Record<PlayerName, Card | null>,
      previous: Object.fromEntries(
        playerNameArr.map((name): [PlayerName, Card | null] => [name, this.getPlayedCard(name, this.previousTrick)])
      ) as Record<PlayerName, Card | null>,
      ladder: {
        ...Object.fromEntries(
          playerNameArr.map(
            (name): [PlayerName, Card[]] => [
              name,
              this.ladders.filter(
                ([_card, player]) => (player !== null) && player.name === name
              ).map((
                [card, _player]) => card
              )
            ]
          )
        ) as Record<PlayerName, Card[]>,
        neutral: this.ladders.filter(([_card, player]) => player === null).map(([card, _player]) => card)
      },
      // TODO: not quite right:
      penultimate: this.isFinalTrick || this.isPenultimateTrick ? this.spoils : [],
      game_state: this.currentState,
      whose_turn: this.currentPlayer.name,
      getCard: (card_str: string): Card => {
        return this.pack.getCard(card_str);
      },
      playCard: (card: Card) => {
        this.playCard(card);
        return this.getStateForUI();
      },
      increment: () => {
        this.increment();
        return this.getStateForUI();
      },
      hand_number: this.handNumber,
      // TODO: placeholders:
      scores: {comp1: 0, player: 0, comp2: 0},
      scores_previous: {comp1: 0, player: 0, comp2: 0},
      score_details: {},
      holding_bonus: {comp1: {}, player: {}, comp2: {}},
      dead: [],
      escalations: -1,
      advance: "C",
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
  game_state: state;
  whose_turn: PlayerName;

  getCard(card_str: string): Card;
  playCard(card: Card): GameStateForUI;
  increment(): GameStateForUI;
}
