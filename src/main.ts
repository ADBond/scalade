import { Game } from './game/game';

import { renderState } from './interface/render';

document.addEventListener("DOMContentLoaded", async () => {
  const game = new Game(['Andy', 'Randy1', 'Randy2']);
  await renderState(game.getGameStateForUI());
});

const helpButton = document.getElementById('help-button')!;
const helpModal = document.getElementById('help-modal')!;
const helpClose = document.getElementById('help-close')!;

helpButton.addEventListener('click', () => {
  helpModal.style.display = 'block';
});

helpClose.addEventListener('click', () => {
  helpModal.style.display = 'none';
});

window.addEventListener('click', (e: MouseEvent) => {
  if (e.target === helpModal) {
    helpModal.style.display = 'none';
  }
});
