import { playUntilHuman } from './interface/api';
import { renderWithDelays } from './interface/render';
import { newGame } from './interface/game';
import { GameMode, BonusCapping } from './game/gamestate';

async function loadGame(gameMode: GameMode, escalations: number, capping: BonusCapping) {
  newGame(gameMode, escalations, capping);
  const futureStates = await playUntilHuman();
  // TODO: avoid this duplication
  await renderWithDelays(futureStates);
}

const DEFAULTS = {
  trumprule: "mobile" as GameMode,
  escalations: 2,
  capping: 'uncapped' as BonusCapping,
};


const button = document.getElementById("new-game-button")!;
const menu = document.getElementById("new-game-menu")!;
const form = document.getElementById("new-game-form") as HTMLFormElement;

function resetValues() {
  (form.querySelector(
    `input[name="trumprule"][value="${DEFAULTS.trumprule}"]`
  ) as HTMLInputElement).checked = true;

  (form.querySelector(
    `input[name="escalations"][value="${DEFAULTS.escalations}"]`
  ) as HTMLInputElement).checked = true;

  (form.querySelector(
    `input[name="capping"][value="${DEFAULTS.capping}"]`
  ) as HTMLInputElement).checked = true;
}

document.addEventListener("DOMContentLoaded", async () => {
  resetValues();
  await loadGame(DEFAULTS.trumprule, DEFAULTS.escalations, DEFAULTS.capping);
});

button.addEventListener("click", () => {
  menu.hidden = !menu.hidden;
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const trumprule = formData.get("trumprule") as GameMode;
  const escalations = formData.get("escalations") as string;
  const capping = formData.get("capping") as BonusCapping;

  menu.hidden = true;
  resetValues();

  await loadGame(trumprule, parseInt(escalations), capping);
});

document.addEventListener("click", (e) => {
  if (!menu.contains(e.target as Node) && e.target !== button) {
    menu.hidden = true;
  }
});

const helpButton = document.getElementById('help-button')!;
const helpModal = document.getElementById('help-modal')!;
const helpClose = document.getElementById('help-close')!;

let scrollTop = 0;

const openModal = () => {
  scrollTop = window.scrollY;
  document.body.classList.add('modal-open');
  document.body.style.top = `-${scrollTop}px`;
  helpModal.classList.add('show');
};

const closeModal = () => {
  helpModal.classList.remove('show');
  setTimeout(() => {
    document.body.classList.remove('modal-open');
    document.body.style.top = '';
    window.scrollTo(0, scrollTop);
  }, 400);
};

helpButton.addEventListener('click', openModal);
helpClose.addEventListener('click', closeModal);

window.addEventListener('click', (e: MouseEvent) => {
  if (e.target === helpModal) closeModal();
});

document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Escape' && helpModal.classList.contains('show')) {
    closeModal();
  }
});
