import { Card, SUITS, Suit, arbitrarySuit } from './card';
import { Pack } from './pack';
import { LadderPosition, Player, PlayerName, playerNameArr } from './player';
import { ScoreBreakdown } from './scores';
import { GameLog } from './log';
import { Agent } from './agent/agent';
// import { randomAgent } from './agent/random';
import { nnAgent } from './agent/nn';

export type GameMode = 'static' | 'mobile' | 'retromobile';
export type BonusCapping = 'nobonus' | 2 | 3 | 'uncapped';
export type state = 'initialiseGame' | 'playCard' | 'trickComplete' | 'handComplete' | 'newHand' | 'gameComplete';

export type GameConfig = {
  trumpRule: GameMode,
  capping: BonusCapping,
  escalations: number,
}

class advanceSuitTracker {
  // TODO: this is basically holdingBonus structure - should we rip it out?
  public advanceSuitArray: [Suit, number][]

  constructor() {
      this.advanceSuitArray = SUITS.map(
          (suit) => {
              return [suit, 0];
          }
      )
  }

  set(suit: Suit, increments: number) {
      this.advanceSuitArray = this.advanceSuitArray.map(
          ([counterSuit, currentIncrements]) => {
              return [counterSuit, Suit.suitEquals(suit, counterSuit) ? increments: currentIncrements];
          }
      )
  }

  increment(suit: Suit) {
      this.set(suit, this.get(suit) + 1);
  }

  get(suit: Suit): number {
      return this.advanceSuitArray.filter(
          ([counterSuit, _currentIncrements]) => Suit.suitEquals(suit, counterSuit)
      )[0][1];
  }
}

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
  // for UI purposes, convenient for now to have spoils from last hand
  public previousSpoils: Card[] = [];
  // and a copy of the groundings
  public currentHandsGroundings: Card[] = [];
  public deadCards: Card[] = [];
  public publicCards: Card[] = [];
  public renounces: Set<number>[] = [];
  public rawLadders: [Card, Player | null | 'trickwinner'][] = this.getStartingLadders();
  public _trumpSuit: Suit = arbitrarySuit;
  public currentState: state = 'initialiseGame';
  public suitRungsAscended: advanceSuitTracker = new advanceSuitTracker();
  public advanceSuit: Suit | null = null;
  public handNumber: number = 0;

  constructor(public playerNames: string[], public config: GameConfig) {
    // TODO: more / flexi ??
    const playerConfig: PlayerName[] = ['player', 'comp1', 'comp2'];
    const agents: Agent[] = ['human', nnAgent("camber"), nnAgent("camber")]
    this.players = playerNames.map(
      (name, i) => new Player(
          name,
          playerConfig[i],
          agents[i],
          i,
        )
    )
    for (const name of playerNames) {
      this.players.push();
    }
    this.dealerIndex = 0;
    this.currentPlayerIndex = 0;
    this.trickIndex = 0;
    this.finalTrickWinnerIndex = -1;
  }

  // config stuff
  get gameMode(): GameMode {
    return this.config.trumpRule;
  }

  get playTo(): number {
    return this.config.escalations;
  }

  get capping(): BonusCapping {
    return this.config.capping
  }

  public async increment(log: GameLog) {
    const state = this.currentState;
    switch (state) {
      case 'initialiseGame':
        this.dealCards(this.pack, log);
        break;
      case 'playCard':
        const moveIndex = await this.computerMove();
        break;
      case 'trickComplete':
        this.resetTrick(log);
        break;
      case 'handComplete':
        this.updateScores(log);
        break;
      case 'newHand':
        if (this.escalations >= this.playTo) {
          this.currentState = "gameComplete";
        } else {
          this.previousSpoils = this.spoils.slice();
          this.dealerIndex = this.getNextPlayerIndex(this.dealerIndex);
          this.dealCards(this.pack, log);
        }
        break;
      case 'gameComplete':
        break;
      default:
        // error!
    }
  }

  get numberOfRanks(): number {
    return this.pack.numRanks;
  }

  get escalations(): number {
    return this.advanceSuit !== null ? Math.floor(this.suitRungsAscended.get(this.advanceSuit) / this.numberOfRanks) : 0;
  }

  get maxHoldingMultiplier(): number {
    if (this.capping === 'nobonus') {
      return 1;
    }
    if (this.capping === 'uncapped') {
      // easier to just return a number higher than any possible multiplier
      return 10000;
    }
    return this.capping;
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

  getPlayer(name: PlayerName): Player {
    return this.players.filter(
      (player) => player.name === name
    )[0];
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

  get humanHand(): Card[] {
    // TODO: don't fix index of human player, maybe?
    return this.getPlayerHand(0);
  }

  get numPlayers(): number {
    return this.players.length;
  }

  getNextPlayerIndex(playerIndex: number): number {
    return ((playerIndex + 1) % this.numPlayers);
  }

  public trickWinnerPlayer(trumpSuit: Suit): Player {
    const winningCardPlay = this.trickInProgress.filter(
      ([card, player]) => Card.cardEquals(card, this.winningCard(trumpSuit))
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
    return this.rawLadders.map(
      ([card, _player]) => card
    )
  }

  get ladders(): [Card, Player | null][] {
    function isResolvedLadder(
      item: [Card, Player | null | 'trickwinner']
    ): item is [Card, Player | null] {
      return item[1] !== 'trickwinner';
    }
    const resolvedLadders = this.rawLadders.filter(isResolvedLadder);
    if (resolvedLadders.length !== 4) {
      console.log(`Attempting to access unresolved ladders: ${this.rawLadders}`);
    }
    return resolvedLadders;
  }

  get trumpSuit(): Suit {
    if (this.gameMode === 'static') {
      return this._trumpSuit;
    }
    // mobile
    return this.trumpSuitFromLadders();
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
    const maxSuit = Math.max(...minRungs.map(card => card.suit.rankForTrumpPreference));
    const maxSuitCards = ladderCards.filter(card => card.suit.rankForTrumpPreference === maxSuit);
    // these should be distinct, so we only have one that is maximal, for a given rank
    if (maxSuitCards.length === 1){
      return maxSuitCards[0].suit;
    }
    // this would indicate an illegal pack, or error in filtering, or something
    throw new Error("Error determining trump suit");
  }

  private incrementRungCount(suit: Suit): void {
    // TODO: implement logic here, which ultimately triggers game end
    this.suitRungsAscended.increment(suit);
    // if we have an advance suit, we don't need further processing
    if (this.advanceSuit !== null) {
      return;
    }
    // TODO: this will need adjusting if we do double
    // check if we are ready to do set advance suit
    const suitsCompletedALap = this.suitRungsAscended.advanceSuitArray.filter(
      ([_suit, count]) => (count >= this.pack.numRanks)
    ).map(
      ([suit, _count]) => suit
    );
    if (suitsCompletedALap.length === 0) {
      // not ready to set advance suit
      return;
    }
    // some suit has gone over the top, so we can set advance suit now
    if (suitsCompletedALap.length === 1) {
      this.advanceSuit = suitsCompletedALap[0];
      return;
    }
    const maxSuitRank = Math.max(...suitsCompletedALap.map((suit) => suit.rankForTrumpPreference));
    const singleMaximalSuit = suitsCompletedALap.filter(
      (suit) => suit.rankForTrumpPreference === maxSuitRank
    );
    if (singleMaximalSuit.length !== 1){
      console.log(`Error in advance suit logic: ${singleMaximalSuit.join(', ')}`);
    }
    this.advanceSuit = singleMaximalSuit[0];
  }

  private updateLadders() {
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
        this.rawLadders = this.rawLadders.filter(
          ([card, _player]) => !Card.cardEquals(card, currentLadderCard)
        );
        // use 'trickwinner' placeholder, as we may not know, if we're playing retromobile
        this.rawLadders.push([newLadderCard, 'trickwinner']);
        // remove new card from trick-in-progress, add old card
        cardsToUpdateLaddersFrom = cardsToUpdateLaddersFrom.filter(
          (card) => !Card.cardEquals(card, newLadderCard)
        );
        cardsToUpdateLaddersFrom.push(currentLadderCard);
        this.incrementRungCount(currentLadderCard.suit);
    }
    return cardsToUpdateLaddersFrom;
  }

  public winningCard(trumpSuit: Suit): Card {
    const trumpCardsPlayed = this.trickInProgress.filter(
      ([card, _player]) => Suit.suitEquals(card.suit, trumpSuit)
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

  get spoilsToDisplay(): Card[] {
    // display spoils from end of penultimate trick until after first user action in next hand
    if (
      (this.isPenultimateTrick && this.currentState === "trickComplete") ||
      (this.isFinalTrick) ||
      (this.currentState === "handComplete")
    ) {
      return this.spoils;
    }
    if (
      (this.humanHand.length === this.cardsPerHand)
     ) {
      return this.previousSpoils;
    }
    return [];
  }

  get groundingsToDisplay(): Card[] {
    // display groundings in first trick, up to first user action
    // also display dead cards (-> groundings) at end of final trick
    if (
      (this.isFinalTrick && this.currentState === "trickComplete") ||
      (this.currentState === "handComplete")
    ) {
      return this.deadCards;
    }
    if (
      (this.humanHand.length === this.cardsPerHand)
    ) {
      return this.currentHandsGroundings;
    }
    return [];
  }

  private async computerMove(): Promise<number> {
    const agent = this.currentPlayer.agent;
    if (agent === 'human') {
      // TODO: error
      console.log("Error: trying to move for a human")
      return -20;
    }

    const currentLegalMoves = this.legalMoveIndices;
    const cardToPlayIndex = await agent.chooseMove(this, currentLegalMoves);
    const cardToPlay = Card.cardFromIndex(cardToPlayIndex, this.pack.getFullPack())

    if (!this.playCard(cardToPlay)) {
      console.log("Error playing card");
    }
    return cardToPlayIndex;
  }

  private resetTrick(log: GameLog) {
    let trumpSuit: Suit;
    if ((this.gameMode === 'static') || (this.gameMode === 'mobile')) {
      trumpSuit = this.trumpSuit;
      this.updateLadders();
    } else {  // retromobile
      this.updateLadders();
      trumpSuit = this.trumpSuit;
    }
    // set trick winner as new current player
    const winnerPlayer = this.trickWinnerPlayer(trumpSuit);
    this.currentPlayerIndex = winnerPlayer.positionIndex;
    // replace the placeholder 'trickwinner' with the actual winner, now we definitely know it
    this.rawLadders = this.rawLadders.map(
      ([card, player]) => [card, player === 'trickwinner' ? winnerPlayer : player]
    )
    //if this was the final trick, we need to record the winner, for scoring
    if (this.isFinalTrick) {
      this.finalTrickWinnerIndex = winnerPlayer.positionIndex;
    }
    // current trick info -> previous trick
    this.previousTrick = this.trickInProgress

    log.captureTrick(trumpSuit, this.trickInProgress, winnerPlayer.positionIndex);
    log.captureLadders(this.ladders);

    // empty the trick, and increment the counter!
    this.trickInProgress = [];
    this.trickIndex++;
    if (this.handNotFinished) {
      this.currentState = "playCard";
    } else {
      this.currentState = "handComplete";
    }
  }

  private dealCards(pack: Pack, log: GameLog, count: number = 12) {
    const halfHandSizeRoundedUp = Math.ceil(count / 2);
    this.pack.reset()
    let remainingPack = this.pack.filterOut(this.pack.getFullPack(), this.ladderCards);
    Pack.shuffle(remainingPack);
    // first hand we have random groundings,
    if (this.handNumber === 0){
      // TODO: this logic can be pulled out!
      for (let i = 0; i < 2; i++) {
        const card = remainingPack.pop();
        if (card) this.groundings.push(card); else console.log("Deal error! ran out of cards before groundings");
      }
    } else {
      this.groundings = [...this.deadCards];
      remainingPack = this.pack.filterOut(remainingPack, this.groundings);
    }
    this.currentHandsGroundings = [...this.groundings];
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
    // console.log("Empty pack:");
    // console.log([...remainingPack]);
    // console.log([...this.getPlayerHand(0)]);
    // console.log([...this.getPlayerHand(1)]);
    // console.log([...this.getPlayerHand(2)]);
    this._trumpSuit = this.trumpSuitFromLadders();
    this.currentState = 'playCard';
    this.currentPlayerIndex = this.getNextPlayerIndex(this.dealerIndex);
    this.handNumber++;
    this.trickIndex = 0;
    this.publicCards = [];
    this.renounces = this.players.map((_player) => new Set());
    // update game log
    log.dealerIndex = this.dealerIndex;
    log.handNumber = this.handNumber;
    log.captureCrossCards("spoils", this.spoils);
    log.captureCrossCards("deads", this.deadCards);
    log.captureCrossCards("grounding", this.currentHandsGroundings);
    log.captureHands(this.players.map((player) => [...this.getPlayerHand(player.positionIndex)]));
    log.staringScores = this.players.map((player) => player.score);
    log.captureLadders(this.ladders);
    log.captureHoldingMultipliers(this.players.map((player) => player.holdingMultipliers.getAll()));
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
    this.publicCards.push(playedCard);

    // track renounces
    // TODO: fix this!!
    // this is not correct, at all. But it is what we had in model training
    // so until we fix that and get new models, let's just align
    // should be dealing with led suit, rather than trumps
    // doesn't make sense for retromobile, but that's just how it is! Probably the best we can do
    if (!Suit.suitEquals(playedCard.suit, this.trumpSuit)) {
      this.renounces[this.currentPlayerIndex].add(this.trumpSuit.rankForTrumpPreference)
    }

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

  updateScores(log: GameLog) {
    this.players.forEach(
      (player) => player.scores.push(new ScoreBreakdown([], 0))
    )
    SUITS.forEach(
      (suit) => {
        // TODO: adjust for double scalade, if we ever decide to implement it
        const [ladderCard, ladderHolder] = this.ladders.filter(
          ([card, _player]) => Suit.suitEquals(card.suit, suit)
        )[0];
        if (ladderHolder !== null) {
          const ladderBaseValue = ladderCard.rank.score;
          const currentMultiplier = ladderHolder.holdingMultipliers.get(suit);
          const breakdown: [number, number] = [ladderBaseValue, currentMultiplier];
          ladderHolder.scores[ladderHolder.scores.length - 1].ladderScores.push(breakdown);
          if (currentMultiplier < this.maxHoldingMultiplier) {
            ladderHolder.holdingMultipliers.increment(suit);
          }
        }
        const playersNotHoldingSuit = this.players.filter(
          (player) => player.positionIndex !== ladderHolder?.positionIndex
        );
        playersNotHoldingSuit.forEach(
          (player) => player.holdingMultipliers.set(suit, 1)
        );
      }
    );
    const finalTrickWinner = this.players[this.finalTrickWinnerIndex];
    const finalTrickBonus = Math.min(
      ...this.ladderCards.map(card => card.rank.score)
    );
    finalTrickWinner.scores[finalTrickWinner.scores.length - 1].finalTrickScore = finalTrickBonus;
    log.complete = true;
    this.currentState = 'newHand';
  }

  getStateForUI(): GameStateForUI {
    return ({
      hands: {comp1: [], player: this.currentState === "handComplete" ? [] : this.humanHand.slice(), comp2: []},
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
      penultimate: this.spoilsToDisplay,
      dead: this.groundingsToDisplay,
      game_state: this.currentState,
      whose_turn: this.currentPlayer.name,
      hand_number: this.handNumber,
      playTo: this.playTo,
      capping: this.capping,
      // scores: {comp1: 0, player: 0, comp2: 0},
      scores: Object.fromEntries(
        playerNameArr.map((name): [PlayerName, number] => [name, this.getPlayer(name).score])
      ) as Record<PlayerName, number>,
      scores_previous: Object.fromEntries(
        playerNameArr.map((name): [PlayerName, number] => [name, this.getPlayer(name).previousScore.score])
      ) as Record<PlayerName, number>,
      score_details: Object.fromEntries(
        playerNameArr.map((name): [PlayerName, string] => [name, this.getPlayer(name).previousScore.display])
      ) as Record<PlayerName, string>,
      holding_bonus: Object.fromEntries(
        playerNameArr.map(
          (name): [PlayerName, Record<string, number>] => [
            name,
            Object.fromEntries(
              SUITS.map(
                (suit): [string, number] => [
                  suit.toStringShort(),
                  this.getPlayer(name).holdingMultipliers.get(suit) - 1
                ]
              )
            )
          ]
        )
      ) as Record<PlayerName, Record<string, number>>,
      escalations: this.escalations,
      advance: this.advanceSuit,
      mode: this.gameMode,
    })
  }
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
  score_details: Record<PlayerName, string>;
  escalations: number;
  hand_number: number;
  trumps: Suit | null;
  advance: Suit | null;
  playTo: number;
  game_state: state;
  whose_turn: PlayerName;
  capping: BonusCapping;
  mode: GameMode;
}
