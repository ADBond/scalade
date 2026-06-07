import { createCardElement, createSuitElement } from './ui';
import { GameStateForUI, GameMode, BonusCapping, state } from '../game/gamestate';
import { LadderPosition, PlayerName, TeamName } from '../game/player';
import { onHumanPlay } from './api';
import { ScoreBreakdown } from '../game/scores';
import { SUITS, Suit } from '../game/card';

const gameModeDisplay: Record<GameMode, string> = {
  mobile: "Mobile Scalade",
  static: "Static Scalade",
  retromobile: "Retromobile Scalade",
};

const cappingDisplay: Record<BonusCapping, string> = {
  nobonus: "No holding bonuses",
  2: "HM capped at 2",
  3: "HM capped at 3",
  uncapped: "Uncapped HM",
}

function displayNameTeam(team: TeamName, numPlayers: number): string {
  switch (team) {
    case 'player':
      return 'Player';
    case 'team02':
      return 'Player & N';
    case 'team024':
      return 'Player & NW & NE';
    case 'team13':
      return 'E & W';
    case 'team135':
      return 'N & SW & SE';
    case 'comp1':
      // TODO: better 5p names once we've settled on layout
      return numPlayers === 3 ? 'West' : 'p1';
    case 'comp2':
      return numPlayers === 3 ? 'East' : 'p2';
    case 'comp3':
      return 'p3';
    case 'comp4':
      return 'p4';
  }
}

function displayNamePlayer(player: PlayerName, numPlayers: number): string {
  switch (player) {
    case 'player':
      return 'Player';
    case 'comp1':
      // TODO: better 5p names once we've settled on layout
      switch (numPlayers) {
        case 3:
        case 4:
          return 'West';
        case 5:
          return 'p1';
        case 6:
          return 'SW';
      }
    case 'comp2':
      // TODO: better 5p names once we've settled on layout
      switch (numPlayers) {
        case 3:
        case 4:
          return 'North';
        case 5:
          return 'p2';
        case 6:
          return 'NW';
      }
    case 'comp3':
      switch (numPlayers) {
        case 4:
          return 'East';
        case 5:
          return 'p3';
        case 6:
          return 'N';
      }
    case 'comp4':
      switch (numPlayers) {
        case 5:
          return 'p4';
        case 6:
          return 'NE';
      }
    case 'comp5':
      return 'SE';
  }
  throw new Error(`Bad lookup: ${player}, ${numPlayers}`);
}

function scoreColgroups(playerNameArr: PlayerName[], numPlayers: number): string {
  const playerColgroupsArr = playerNameArr.map(
    (playerName, idx) => {
      let colsStr = `
        <col class="sb-${playerName} sb-wide">
        <col class="sb-${playerName} sb-narrow">
        <col class="sb-${playerName} sb-wide">
        <col class="sb-${playerName} sb-narrow">
        <col class="sb-${playerName} sb-wide">
      `;
      if (idx !== numPlayers - 1) {
        colsStr += `<col class="sb-${playerName} sb-dummy">`;
      }
      return colsStr;
    }
  );
  const playerColgroups = playerColgroupsArr.join("");
  return `
  <colgroup>
    <col class="sb-suit-col">
    ${playerColgroups}
  </colgroup>
  `
}

function scoreBreakdownHeaderRow(playerNames: PlayerName[], numPlayers: number): string{
  const playerHeaders = playerNames.map(
    (playerName) => {
      const displayName = displayNamePlayer(playerName, numPlayers);
      return `<th colspan=6>${displayName}</th>`;
    }
  ).join("");
  return `
    <tr>
      <th rowspan="2"></th>
      ${playerHeaders}
    </tr>
  `;
}

function scoreBreakdownSubHeaderRow(numPlayers: number): string{
  const playerHeaders = `
    <th>B</th>
    <th></th>
    <th>M</th>
    <th></th>
    <th>T</th>
    <th></th>
  `;
  return `
    <tr>
      ${playerHeaders.repeat(numPlayers)}
    </tr>
  `
}

function constructSuitRow(scoreDetails: Partial<Record<PlayerName, ScoreBreakdown>>, suit: Suit){
  const playerCols = Object.entries(scoreDetails).map(
    ([_playerName, breakdown]) => {
      let cellContents: string[];
      const baseAndMult = breakdown.baseAndMultiplier(suit);
      if (baseAndMult === null) {
        cellContents = [
          "-",
          "",
          "-",
          "",
          "-",
          ""
        ]
      } else {
        cellContents = [
          `${baseAndMult[0]}`,
          "&times;",
          `${baseAndMult[1]}`,
          "&equals;",
          `${baseAndMult[0] * baseAndMult[1]}`,
          ""
        ];
      }
      return cellContents.map(
        cell => `<td>${cell}</td>`
      ).join("");
    }
  ).join("");

  return `
    <tr>
      <td class="suit-${suit.name.toLowerCase()} suit-symbol sb-row-head">${suit.html}</td>
      ${playerCols}
    </tr>
  `;
}

function constructFTRow(scoreDetails: Partial<Record<PlayerName, ScoreBreakdown>>){
  // TODO: bit awkward to keep this, and total, in sync with suitRow
  const playerCols = Object.entries(scoreDetails).map(
    ([_playerName, breakdown]) => {
      let cellContents: string[];
      const finalTrickScore = breakdown.finalTrickScore;
      if (finalTrickScore === 0) {
        cellContents = [
          "",
          "",
          "",
          "",
          "-",
          ""
        ];
      } else {
        cellContents = [
          "",
          "",
          "",
          "",
          `${finalTrickScore}`,
          ""
        ];
      }
      return cellContents.map(
        cell => `<td>${cell}</td>`
      ).join("");
    }
  ).join("");

  return `
    <tr>
      <td class="sb-row-head">FT</td>
      ${playerCols}
    </tr>
  `;
}

function constructTotalRow(scoreDetails: Partial<Record<PlayerName, ScoreBreakdown>>){
  // TODO: bit awkward to keep this, and total, in sync with suitRow
  const playerCols = Object.entries(scoreDetails).map(
    ([_playerName, breakdown]) => {
      let cellContents: string[];
      const totalScore = breakdown.score;
      if (totalScore === 0) {
        cellContents = [
          "",
          "",
          "",
          "",
          "-",
          ""
        ];
      } else {
        cellContents = [
          "",
          "",
          "",
          "",
          `${totalScore}`,
          ""
        ];
      }
      return cellContents.map(
        cell => `<td class="sb-final-row">${cell}</td>`
      ).join("");
    }
  ).join("");

  return `
    <tr>
      <td class="sb-row-head sb-final-row">Tot.</td>
      ${playerCols}
    </tr>
  `;
}

function renderScoreBreakdown(scoreDetails: Partial<Record<PlayerName, ScoreBreakdown>>): void {

  const playerNames = Object.keys(scoreDetails) as PlayerName[];
  const numPlayers = Object.keys(scoreDetails).length;
  // is this the best way to construct this? not sure, but it is certainly _a_ way
  // too tedious to build in html by hand
  const breakdownTable = document.getElementById("sb-table")!;
  const tableInnardsHTML = `
    ${scoreColgroups(playerNames, numPlayers)}
    <thead>
    ${scoreBreakdownHeaderRow(playerNames, numPlayers)}
    ${scoreBreakdownSubHeaderRow(numPlayers)}
    </thead>
    <tbody>
    ${SUITS.map(suit => constructSuitRow(scoreDetails, suit)).join("")}
    ${constructFTRow(scoreDetails)}
    ${constructTotalRow(scoreDetails)}
    </tbody>
  `;
  breakdownTable.innerHTML = tableInnardsHTML;
}

export async function renderState(state: GameStateForUI) {

  const handEl = document.getElementById('player-hand')!;
  const playerHand = state.hands.player;
  playerHand.sort(
    (c1, c2) => (
      // 100 big enough to ensure we always sort by suit first
      100*(c1.suit.rankForTrumpPreference - c2.suit.rankForTrumpPreference) +
      (c1.rank.trickTakingRank - c2.rank.trickTakingRank)
    )
  );
  handEl.innerHTML = '';
  playerHand.forEach(card => {
    handEl.appendChild(
      createCardElement(card.toStringShort(), state.whoseTurn === "player" ? (() => onHumanPlay(state, card)) : undefined)
    )
  });
  const numPlayers = state.playerNames.length;

  const playerAreaEl = document.getElementById('player-areas')!;
  const prevAreaEl = document.getElementById('prev-area')!;
  playerAreaEl.innerHTML = '';
  prevAreaEl.innerHTML = '';
  prevAreaEl.classList.add('prev-area');

  state.playerNames.forEach(playerName => {
    const areaEl = document.createElement('div');
    areaEl.classList.add(`player-area`);
    areaEl.classList.add(`${playerName}-${numPlayers}`);
    playerAreaEl.appendChild(areaEl);

    const ladderEl = document.createElement('div');
    ladderEl.id = `ladder-${playerName}`;
    ladderEl.classList.add('ladder');
    areaEl.appendChild(ladderEl);

    const playedEl = document.createElement('div');
    playedEl.id = `played-${playerName}`;
    playedEl.classList.add('played');
    areaEl.appendChild(playedEl);
    const playedCard = state.played[playerName as PlayerName]!;
    const playedCardEl = createCardElement(playedCard !== null ? playedCard.toStringShort(): "");
    playedCardEl.classList.add('played-card');
    playedEl.appendChild(playedCardEl);

    const prevEl = document.createElement('div');
    prevEl.id = `prev-${playerName}-${numPlayers}`;
    prevEl.classList.add('prev-slot');
    prevAreaEl.appendChild(prevEl);
    const prevCard = state.previous[playerName as PlayerName]!;
    const prevCardEl = createCardElement(prevCard !== null ? prevCard.toStringShort(): "");
    prevCardEl.classList.add('played-card');
    prevEl.appendChild(prevCardEl);

    const bonusEl = document.createElement('div');
    bonusEl.id = `hb-${playerName}`;
    bonusEl.classList.add('holding-bonus');
    areaEl.appendChild(bonusEl);
    const bonuses = state.holdingBonus[playerName as PlayerName];
    for (const [suit, multiplier] of Object.entries(bonuses)) {
      for (let i = 0; i < multiplier; i++) {
        const suitEl = createSuitElement(suit);
        suitEl.classList.add("holding-bonus-icon");
        bonusEl.appendChild(suitEl);
      }
    }
  });

  ['neutral', ...state.playerNames].forEach(p => {
    const ladderEl = document.getElementById(`ladder-${p}`)!;
    const ladders = state.ladder;
    // sort ladder for consistent ordering - by suit
    ladders[p as LadderPosition].sort(
      (card1, card2) => card1.suit.rankForTrumpPreference - card2.suit.rankForTrumpPreference
    )
    ladderEl.innerHTML = '';
    ladders[p as LadderPosition].forEach(card => {
      ladderEl.appendChild(createCardElement(card.toStringShort()));
    });
  });

  const penultimateEl = document.getElementById("penultimate-display")!;
  const deadEl = document.getElementById("dead-display")!;
  penultimateEl.innerHTML = '';
  deadEl.innerHTML = '';
  const spoils = state.penultimate.length > 0 ? state.penultimate.map(card => card.toStringShort()) : ["none", "none"];
  const deads = state.dead.length > 0 ? state.dead.map(card => card.toStringShort()) : ["none", "none"];
  spoils.forEach(card => penultimateEl.appendChild(createCardElement(card)));
  deads.forEach(card => deadEl.appendChild(createCardElement(card)));

  // game status - config
  document.getElementById('trump-mode')!.innerText = gameModeDisplay[state.mode];
  document.getElementById('escalation-limit')!.innerText = `to ${state.playTo} escalations`;
  document.getElementById('capping')!.innerText = cappingDisplay[state.capping];
  // and current status
  document.getElementById('hand-number')!.innerText = `(hand #${state.handNumber})`;
  document.getElementById('escalations')!.innerText = `Escalations: ${state.escalations}`;

  const advanceEl = document.getElementById('advance')!;
  advanceEl.innerHTML = '';
  advanceEl.appendChild(createSuitElement(state.advance ? state.advance.toStringShort() : ""));

  const trumpEl = document.getElementById('trumps')!;
  trumpEl.innerHTML = '';
  trumpEl.appendChild(createSuitElement(state.trumps ? state.trumps.toStringShort() : ""));

  // populate the scores in the UI
  const namesHolder = document.getElementById('scores-headers')!;
  const currentScoresHolder = document.getElementById('scores-current')!;
  const prevScoresHolder = document.getElementById('scores-previous')!;
  namesHolder.innerHTML = '';
  currentScoresHolder.innerHTML = '';
  prevScoresHolder.innerHTML = '';
  state.teamNames.forEach(
    (teamName) => {
      const headerEl = document.createElement('th');
      headerEl.innerText = displayNameTeam(teamName, state.playerNames.length);
      namesHolder.appendChild(headerEl);
      const teamScoreEl = document.createElement('td');
      teamScoreEl.id = `score-${teamName}`;
      teamScoreEl.innerText = `${state.scores[teamName]!}`;
      currentScoresHolder.appendChild(teamScoreEl);

      const prevScoreEl = document.createElement('td');
      prevScoreEl.id = `score-player-${teamName}`;
      // TODO: need to translate to team prev instead for this
      prevScoreEl.innerText = `(${state.scoresPrev[teamName]!})`;
      prevScoresHolder.appendChild(prevScoreEl);
    }
  )

  renderScoreBreakdown(state.scoreBreakdownsPrevious);

  // document.getElementById('debug')!.innerText = `${state.gameState}`;

}

const delayMap: Record<state, number> = {
  initialiseGame: 10,
  playCard: 700,
  trickComplete: 1700,
  handComplete: 3000,
  newHand: 10,
  gameComplete: 10,
}

export async function renderWithDelays(states: GameStateForUI[]) {
  for (const state of states) {
    await renderState(state);
    await wait(delayMap[state.gameState]);
  }
}


function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
