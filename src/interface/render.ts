import { createCardElement, createSuitElement } from './ui';
import { GameStateForUI, ScoreDetails } from '../game/gamestate';
import { PlayerName } from '../game/player';
import { playCard } from './api';

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

export async function renderState(state: GameStateForUI) {
  console.log(state);

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
      createCardElement(card.toStringShort(), state.whose_turn === "player" ? (() => playCard(state, card)) : undefined)
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

  // document.getElementById('score-breakdown')!.innerText =
  //   constructScoreBreakdownText(state.score_details);

  document.getElementById('escalations')!.innerText =
    `Escalations: ${state.escalations} (hand #${state.hand_number})`;

  const trumpEl = document.getElementById('trumps')!;
  trumpEl.innerHTML = '';
  trumpEl.appendChild(createSuitElement(state.trumps ? state.trumps.toStringShort() : ""));

  const advanceEl = document.getElementById('advance')!;
  advanceEl.innerHTML = '';
  advanceEl.appendChild(createSuitElement(state.advance));

  let newState: GameStateForUI;
  switch (state.game_state) {
    case "playCard":
      if (state.whose_turn === "player") break;
      await wait(700);
      newState = incrementState(state);
      await renderState(newState);
      break;
    case "trickComplete":
      await wait(1700);
      newState = incrementState(state);
      await renderState(newState);
      break;
    case "handComplete":
      await wait(3000);
      newState = incrementState(state);
      await renderState(newState);
      break;
    default:
      console.log(`Error: Switching and failing: ${state.game_state}`);

  }
}


function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function incrementState(state: GameStateForUI): GameStateForUI {
  return state.increment();
}
