import "./style.css";
import * as game from "./game.js";
import * as bp from "./battlepass.js";
import * as P from "./progress.js";
import { getSkin, getDeath } from "./skins.js";

const $ = (id) => document.getElementById(id);
const toastEl = $("toast");
const ALLY = { azul: "#378ADD", verde: "#5DCAA5" };
const ENEMY = { rojo: "#E24B4A", negro: "#0e131c" };

function refreshUI() {
  $("lvl").textContent = P.getState().level;
  bp.renderSkins($("skingrid"), $("deathgrid"), refreshUI);
  bp.renderBP($("bpbar"), $("bptrack"));
  renderOptions();
  renderControls();
}

function renderOptions() {
  buildSwatches($("ally-colors"), ALLY, "ally");
  buildSwatches($("enemy-colors"), ENEMY, "enemy");
}
function buildSwatches(box, map, key) {
  box.innerHTML = "";
  Object.keys(map).forEach((name) => {
    const sw = document.createElement("div");
    sw.className = "swatch" + (P.getSetting(key) === name ? " sel" : "");
    sw.style.background = map[name];
    sw.title = name;
    sw.onclick = () => { P.setSetting(key, name); renderOptions(); };
    box.appendChild(sw);
  });
}

function renderControls() {
  $("bind-sw").textContent = P.getSetting("keySwitch").toUpperCase();
  $("bind-rl").textContent = P.getSetting("keyReload").toUpperCase();
  $("hk-sw").textContent = P.getSetting("keySwitch").toUpperCase();
  $("hk-rl").textContent = P.getSetting("keyReload").toUpperCase();
}
function bindKey(btn, settingKey) {
  btn.onclick = () => {
    btn.classList.add("listening"); btn.textContent = "…";
    const onKey = (e) => {
      e.preventDefault();
      P.setSetting(settingKey, e.key.toLowerCase());
      btn.classList.remove("listening");
      window.removeEventListener("keydown", onKey, true);
      renderControls();
    };
    window.addEventListener("keydown", onKey, true);
  };
}

let toastT;
function toast(msg) { toastEl.textContent = msg; toastEl.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("show"), 2600); }

function gainXP(amt) {
  const res = P.addXP(amt);
  if (res.unlocks.length) {
    const names = res.unlocks.map((id) => (getSkin(id).id === id ? getSkin(id).name : getDeath(id).name));
    toast("¡Desbloqueaste: " + names.join(", ") + "!");
  } else if (res.leveledTo) toast("¡Subiste a nivel " + res.leveledTo + "!");
  refreshUI();
}

game.init($("g"), { kill: () => gainXP(50), win: () => gainXP(200), match: () => gainXP(60) });

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
  b.addEventListener("click", () => game.start(b.dataset.m, { size: parseInt($("sz").value) || 3, kill: parseInt($("kt").value) || 15 }));
});

$("buyprem").addEventListener("click", () => {
  if (P.isPremium()) { toast("Ya tienes el pase premium"); return; }
  const unlocks = P.buyPremium();
  toast(unlocks.length ? "¡Pase premium! Skins nuevas: " + unlocks.length : "¡Pase premium activado!");
  refreshUI();
});

bindKey($("bind-sw"), "keySwitch");
bindKey($("bind-rl"), "keyReload");

refreshUI();
