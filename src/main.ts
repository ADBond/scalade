import { Game } from './game/game';

import { renderState } from './interface/render';

document.addEventListener("DOMContentLoaded", async () => {
  const game = new Game(['Andy', 'Randy1', 'Randy2']);
  await renderState(game.getGameStateForUI());
});
