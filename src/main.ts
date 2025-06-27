import { Game } from './game/game';

import { fetchState } from './interface/render';

window.onload = () => {
  const game = new Game(['Andy', 'Randy1', 'Randy2']);
  fetchState(game);
};
