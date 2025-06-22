import { createCardElement, createSuitElement } from './ui';
import { GameState, PlayerName, ScoreDetails } from './types';

function constructScoreBreakdownText(scoreDetails: ScoreDetails): string {
  return ['player', 'comp1', 'comp2'].map(name => {
    const deets = scoreDetails[name];
    let detailsString = `${name}: `;
    for (const [suit, sDetail] of Object.entries(deets.ladder_bonuses)) {
      let suitString = `+ ${sDetail.rank_base_value} `;
      if (sDetail.holding_bonus_multiplier > 1) {
        suitString += `x ${sDetail.holding_bonus_multiplier} `;
      }
      suitString += ` (${suit}) `;
      detailsString += suitString;
    }
    if (deets.final_trick_bonus !== 0) {
      detailsString += ` + ${deets.final_trick_bonus} (FT)`;
    }
    return detailsString;
  }).join(", ");
}

export function renderState(state: GameState): void {
  console.log(state);

  const handEl = document.getElementById('player-hand')!;
  handEl.innerHTML = '';
  state.hands.player.forEach(card => {
    handEl.appendChild(createCardElement(card, playCard));
  });

  ['player', 'comp1', 'comp2'].forEach(p => {
    const playedEl = document.getElementById(`played-${p}`)!;
    playedEl.innerHTML = '';
    const card = state.played[p as PlayerName];
    if (card) {
      const el = createCardElement(card);
      el.classList.add('played-card');
      playedEl.appendChild(el);
    }
  });

  ['player', 'comp1', 'comp2'].forEach(p => {
    const prevEl = document.getElementById(`prev-${p}`)!;
    prevEl.innerHTML = '';
    const card = state.previous[p as PlayerName];
    if (card) {
      const el = createCardElement(card);
      el.classList.add('played-card');
      prevEl.appendChild(el);
    }
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
      ladderEl.appendChild(createCardElement(card));
    });
  });

  const penultimateEl = document.getElementById("penultimate-display")!;
  const deadEl = document.getElementById("dead-display")!;
  penultimateEl.innerHTML = '';
  deadEl.innerHTML = '';
  state.penultimate.forEach(card => penultimateEl.appendChild(createCardElement(card)));
  state.dead.forEach(card => deadEl.appendChild(createCardElement(card)));

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
  trumpEl.appendChild(createSuitElement(state.trumps));

  const advanceEl = document.getElementById('advance')!;
  advanceEl.innerHTML = '';
  advanceEl.appendChild(createSuitElement(state.advance));

  switch (state.game_state) {
    case "play_card":
      if (state.whose_turn === "human") break;
      waitAndContinue(700);
      break;
    case "trick_complete":
      waitAndContinue(1700);
      break;
    case "hand_complete":
      waitAndContinue(3000);
      break;
  }
}

async function waitAndContinue(ms: number): Promise<void> {
  await sleep(ms);
  incrementState();
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchState(): Promise<void> {
  const res = await fetch('/game_state');
  const state: GameState = await res.json();
  renderState(state);
}

export async function playCard(card: string): Promise<void> {
  const res = await fetch('/play_card', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ card })
  });
  const state: GameState = await res.json();
  renderState(state);
}

export async function incrementState(): Promise<void> {
  const res = await fetch('/increment_state', { method: 'POST' });
  const state: GameState = await res.json();
  renderState(state);
}
