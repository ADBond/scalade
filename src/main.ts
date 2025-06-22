import { Game } from './game/game';

import { fetchState } from './interface/render';

window.onload = () => {
  const game = new Game(['Alice', 'Bob', 'Charlie']);
  fetchState(game);
};
