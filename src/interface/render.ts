import { createCardElement, createSuitElement } from './ui';
import { GameStateForUI, state } from '../game/gamestate';
import { PlayerName } from '../game/player';
import { onHumanPlay } from './api';

function constructScoreBreakdownText(scoreDetails: Record<PlayerName, string>): string {
  return Object.entries(scoreDetails).map(
    ([playerName, scoreDetail]) => `(${playerName}): ${scoreDetail}`
  ).join(", ");
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
      createCardElement(card.toStringShort(), state.whose_turn === "player" ? (() => onHumanPlay(state, card)) : undefined)
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
    const bonuses = state.holding_bonus[p as PlayerName];
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
    ladderEl.innerHTML = '';
    state.ladder[p as PlayerName].forEach(card => {
      ladderEl.appendChild(createCardElement(card.toStringShort()));
    });
  });

  const penultimateEl = document.getElementById("penultimate-display")!;
  const deadEl = document.getElementById("dead-display")!;
  penultimateEl.innerHTML = '';
  deadEl.innerHTML = '';
  state.penultimate.forEach(card => penultimateEl.appendChild(createCardElement(card.toStringShort())));
  state.dead.forEach(card => deadEl.appendChild(createCardElement(card.toStringShort())));

  document.getElementById('scores')!.innerText =
    `You: ${state.scores.player}, comp 1: ${state.scores.comp1}, comp 2: ${state.scores.comp2}`;
  document.getElementById('scores-previous')!.innerText =
    `prev: (You: ${state.scores_previous.player}, comp 1: ${state.scores_previous.comp1}, comp 2: ${state.scores_previous.comp2})`;

  document.getElementById('score-breakdown')!.innerText =
    constructScoreBreakdownText(state.score_details);

  document.getElementById('escalations')!.innerText =
    `Escalations: ${state.escalations} (hand #${state.hand_number})`;

  const trumpEl = document.getElementById('trumps')!;
  trumpEl.innerHTML = '';
  trumpEl.appendChild(createSuitElement(state.trumps ? state.trumps.toStringShort() : ""));

  const advanceEl = document.getElementById('advance')!;
  advanceEl.innerHTML = '';
  advanceEl.appendChild(createSuitElement(state.advance));

}

const delayMap: Record<state, number> = {
  initialiseGame: 10,
  playCard: 700,
  trickComplete: 1700,
  handComplete: 3000,
  gameComplete: 10,
}

export async function renderWithDelays(states: GameStateForUI[]) {
  for (const state of states) {
    await renderState(state);
    await wait(delayMap[state.game_state]);
  }
}


function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
