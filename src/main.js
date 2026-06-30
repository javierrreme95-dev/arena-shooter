import "./style.css";
import * as game from "./game.js";
import * as bp from "./battlepass.js";
import * as P from "./progress.js";
import { getSkin } from "./skins.js";

const $ = (id) => document.getElementById(id);
const grid = $("skingrid"), bpbar = $("bpbar"), bptrack = $("bptrack"), toastEl = $("toast");

function refreshUI() {
  $("lvl").textContent = P.getState().level;
  bp.renderSkins(grid, refreshUI);
  bp.renderBP(bpbar, bptrack, refreshUI);
}

let toastT;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastT);
  toastT = setTimeout(() => toastEl.classList.remove("show"), 2600);
}

function gainXP(amt) {
  const res = P.addXP(amt);
  if (res.unlocks.length) toast("¡Desbloqueaste: " + res.unlocks.map((id) => getSkin(id).name).join(", ") + "!");
  else if (res.leveledTo) toast("¡Subiste a nivel " + res.leveledTo + "!");
  refreshUI();
}

game.init($("g"), {
  kill: () => gainXP(50),
  win: () => gainXP(200),
  match: () => gainXP(60),
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    tab.classList.add("active");
    $("view-" + tab.dataset.view).classList.add("active");
    if (tab.dataset.view !== "play") refreshUI();
  });
});

document.querySelectorAll(".mb").forEach((b) => {
  b.addEventListener("click", () => {
    game.start(b.dataset.m, { size: parseInt($("sz").value) || 3, kill: parseInt($("kt").value) || 15 });
  });
});

$("buyprem").addEventListener("click", () => {
  if (P.isPremium()) { toast("Ya tienes el pase premium"); return; }
  const unlocks = P.buyPremium();
  toast(unlocks.length ? "¡Pase premium activado! Skins nuevas: " + unlocks.length : "¡Pase premium activado!");
  refreshUI();
});

refreshUI();
