import { Game } from './game/game';

import { renderState } from './interface/render';

document.addEventListener("DOMContentLoaded", async () => {
  const game = new Game(['Andy', 'Randy1', 'Randy2']);
  await renderState(game.getGameStateForUI());
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
