import { Card, Rank, Suit, GameState, ScoreDetails, PlayerName } from './types';

const cardMap: Record<Rank, number> = {
  '2': 0, '3': 1, '4': 2, '5': 3, '6': 4, '7': 5,
  '8': 6, '9': 7, 'T': 8, 'J': 9, 'Q': 10, 'K': 11, 'A': 12
};

const suitMap: Record<Suit, number> = {
  'S': 0, 'H': 1, 'C': 2, 'D': 3
};

const cardWidth = 72;
const cardHeight = 96;

export function createCardElement(card: string, onClick?: (c: string) => void): HTMLElement {
  const span = document.createElement('span');
  span.className = 'card';
  const match = card.match(/^([0-9TJQKA])([SHDC])$/);

  if (match) {
    const [, rank, suit] = match as [string, Rank, Suit];
    const col = cardMap[rank];
    const row = suitMap[suit];
    span.style.backgroundPosition = `-${col * cardWidth}px -${row * cardHeight}px`;
  } else {
    span.innerText = card;
    span.style.background = '#ccc';
  }

  if (onClick) span.onclick = () => onClick(card);
  return span;
}

export function createSuitElement(suit: string): HTMLElement {
  const span = document.createElement('span');
  span.className = 'suit-icon';
  const match = suit.match(/^([SHDC])$/);
  const iconHeight = 32;

  if (match) {
    const [, s] = match as [string, Suit];
    const row = suitMap[s];
    span.style.backgroundPosition = `32px -${row * iconHeight}px`;
  } else {
    span.innerText = "";
    span.style.background = '#ccc';
  }

  return span;
}
