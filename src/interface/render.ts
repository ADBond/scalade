import { createCardElement, createSuitElement } from './ui';
import { GameStateForUI, GameMode, BonusCapping, state } from '../game/gamestate';
import { LadderPosition, PlayerName, playerNameArr } from '../game/player';
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

function scoreColgroups(): string {
  const playerColgroups = playerNameArr.map(
    (playerName) => {
      return `
        <col class="sb-${playerName} sb-wide">
        <col class="sb-${playerName} sb-narrow">
        <col class="sb-${playerName} sb-wide">
        <col class="sb-${playerName} sb-narrow">
        <col class="sb-${playerName} sb-wide">
      `;
    }
  ).join("");
  return `
  <colgroup>
    <col class="sb-suit-col">
    ${playerColgroups}
  </colgroup>
  `
}

function scoreBreakdownHeaderRow(displayNameLookup: Record<PlayerName, string>): string{
  const playerHeaders = Object.entries(displayNameLookup).map(
    ([_playerName, displayName]) => `<th colspan=5>${displayName}</th>`
  ).join("");
  return `
    <tr>
      <th rowspan="2">Suit</th>
      ${playerHeaders}
    </tr>
  `;
}

function scoreBreakdownSubHeaderRow(): string{
  const numPlayers = 3;
  const playerHeaders = `
    <th>B</th>
    <th></th>
    <th>M</th>
    <th></th>
    <th>T</th>
  `;
  return `
    <tr>
      ${playerHeaders.repeat(numPlayers)}
    </tr>
  `
}

function constructSuitRow(scoreDetails: Record<PlayerName, ScoreBreakdown>, suit: Suit){
  // TODO: populate
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
        ]
      } else {
        cellContents = [
          `${baseAndMult[0]}`,
          "&times;",
          `${baseAndMult[1]}`,
          "&equals;",
          `${baseAndMult[0] * baseAndMult[1]}`,
        ];
      }
      return cellContents.map(
        cell => `<td>${cell}</td>`
      ).join("");
    }
  ).join("");

  return `
    <tr>
      <td class="suit-${suit.name.toLowerCase()} suit-symbol">${suit.html}</td>
      ${playerCols}
    </tr>
  `;
}

function renderScoreBreakdown(scoreDetails: Record<PlayerName, ScoreBreakdown>): void {
  // TODO: can i put this more central, as we use it elsewhere
  const displayNameLookup: Record<PlayerName, string> = {
    player: 'Player',
    comp1: 'Left',
    comp2: 'Right',
  };
  const playerNames = Object.keys(displayNameLookup) as PlayerName[];
  // is this the best way to construct this? not sure, but it is certainly _a_ way
  // too tedious to build in html by hand
  const breakdownTable = document.getElementById("sb-table")!;
  const tableInnardsHTML = `
    ${scoreColgroups()}
    <thead>
    ${scoreBreakdownHeaderRow(displayNameLookup)}
    ${scoreBreakdownSubHeaderRow()}
    </thead>
    <tbody>
    ${SUITS.map(suit => constructSuitRow(scoreDetails, suit)).join("")}
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

  ['player', 'comp1', 'comp2'].forEach(p => {
    const playedEl = document.getElementById(`played-${p}`)!;
    playedEl.innerHTML = '';
    const card = state.played[p as PlayerName];
    const el = createCardElement(card !== null ? card.toStringShort(): "");
    el.classList.add('played-card');
    playedEl.appendChild(el);
  });

  ['player', 'comp1', 'comp2'].forEach(p => {
    const prevEl = document.getElementById(`prev-${p}`)!;
    prevEl.innerHTML = '';
    const card = state.previous[p as PlayerName];
    const el = createCardElement(card !== null ? card.toStringShort(): "");
    el.classList.add('played-card');
    prevEl.appendChild(el);
  });

  ['player', 'comp1', 'comp2'].forEach(p => {
    const bonusEl = document.getElementById(`hb-${p}`)!;
    bonusEl.innerHTML = '';
    const bonuses = state.holdingBonus[p as PlayerName];
    for (const [suit, multiplier] of Object.entries(bonuses)) {
      for (let i = 0; i < multiplier; i++) {
        const suitEl = createSuitElement(suit);
        suitEl.classList.add("holding-bonus-icon");
        bonusEl.appendChild(suitEl);
      }
    }
  });

  ['neutral', 'player', 'comp1', 'comp2'].forEach(p => {
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
  document.getElementById('score-player')!.innerText = `${state.scores.player}`;
  document.getElementById('score-comp1')!.innerText = `${state.scores.comp1}`;
  document.getElementById('score-comp2')!.innerText = `${state.scores.comp2}`;

  document.getElementById('score-player-prev')!.innerText = `(${state.scoreBreakdownsPrevious.comp1.score})`;
  document.getElementById('score-comp1-prev')!.innerText = `(${state.scoreBreakdownsPrevious.comp1.score})`;
  document.getElementById('score-comp2-prev')!.innerText = `(${state.scoreBreakdownsPrevious.comp2.score})`;

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
