import { Game } from './game/game';

import { renderState } from './interface/render';

window.onload = () => {
  const game = new Game(['Andy', 'Randy1', 'Randy2']);
  renderState(game.getGameStateForUI());
};
