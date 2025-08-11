import { playUntilHuman } from './interface/api';
import { renderWithDelays } from './interface/render';
import { newGame } from './interface/game';
import { GameMode } from './game/gamestate';

async function loadGame(gameMode: GameMode) {
  newGame(gameMode);
  const futureStates = await playUntilHuman();
  // TODO: avoid this duplication
  await renderWithDelays(futureStates);
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadGame('static');
});

const button = document.getElementById("new-game-button")!;
const menu = document.getElementById("new-game-menu")!;

button.addEventListener("click", () => {
  menu.hidden = !menu.hidden;
});

menu.addEventListener("click", async (e) => {
  const target = e.target as HTMLElement;
  if (target.classList.contains("option")) {
    const option = target.dataset.option! as GameMode;
    menu.hidden = true;
    await loadGame(option);
  }
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
