import { playUntilHuman } from './interface/api';
import { renderWithDelays } from './interface/render';
import { newGame } from './interface/game';
import { GameConfig, GameMode, BonusCapping } from './game/gamestate';

async function loadGame(config: GameConfig) {
  newGame(config);
  const futureStates = await playUntilHuman();
  // TODO: avoid this duplication
  await renderWithDelays(futureStates);
}

const DEFAULTS: GameConfig = {
  trumpRule: "mobile",
  escalations: 2,
  capping: "uncapped",
};


const button = document.getElementById("new-game-button")!;
const menu = document.getElementById("new-game-menu")!;
const form = document.getElementById("new-game-form") as HTMLFormElement;

function resetValues() {
  (form.querySelector(
    `input[name="trumprule"][value="${DEFAULTS.trumpRule}"]`
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
  await loadGame(DEFAULTS);
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
  const config: GameConfig = {
    trumpRule: trumprule,
    escalations: parseInt(escalations),
    capping: capping,
  }

  menu.hidden = true;
  resetValues();

  await loadGame(config);
});

document.addEventListener("click", (e) => {
  if (!menu.contains(e.target as Node) && e.target !== button) {
    menu.hidden = true;
  }
});

type ModalElements = {
  button: HTMLElement;
  modal: HTMLElement;
  close: HTMLElement;
};

const modals: ModalElements[] = [
  {
    button: document.getElementById("help-button")!,
    modal: document.getElementById("help-modal")!,
    close: document.getElementById("help-close")!,
  },
  {
    button: document.getElementById("privacy-button")!,
    modal: document.getElementById("privacy-modal")!,
    close: document.getElementById("privacy-close")!,
  },
];

let scrollTop = 0;

const openModal = (modal: HTMLElement) => {
  scrollTop = window.scrollY;
  document.body.classList.add("modal-open");
  document.body.style.top = `-${scrollTop}px`;
  modal.classList.add("show");
};

const closeModal = (modal: HTMLElement) => {
  modal.classList.remove("show");
  setTimeout(() => {
    document.body.classList.remove("modal-open");
    document.body.style.top = "";
    window.scrollTo(0, scrollTop);
  }, 400);
};

modals.forEach(({ button, modal, close }) => {
  button.addEventListener("click", () => openModal(modal));
  close.addEventListener("click", () => closeModal(modal));

  window.addEventListener("click", (e: MouseEvent) => {
    if (e.target === modal) closeModal(modal);
  });

  document.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Escape" && modal.classList.contains("show")) {
      closeModal(modal);
    }
  });
});
