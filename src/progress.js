import { TIERS } from "./battlepass.js";

const KEY = "arena.progress.v1";
export const XP_PER = 300;
export const MAXLV = 12;
const DEFAULT_UNLOCKED = ["recluta", "azul", "verde"];

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; }
}

let state = load() || {
  xp: 0,
  level: 1,
  premium: false,
  unlocked: DEFAULT_UNLOCKED.slice(),
  equipped: "azul",
};

function save() { localStorage.setItem(KEY, JSON.stringify(state)); }

export function getState() { return state; }
export function getEquipped() { return state.equipped; }
export function setEquipped(id) { state.equipped = id; save(); }
export function isUnlocked(id) { return state.unlocked.includes(id); }
export function isPremium() { return state.premium; }

export function levelFromXp(xp) { return Math.min(MAXLV, Math.floor(xp / XP_PER) + 1); }
export function xpInLevel() { return state.xp - (state.level - 1) * XP_PER; }

export function addXP(amount) {
  const before = state.level;
  state.xp += amount;
  const after = levelFromXp(state.xp);
  state.level = after;
  const unlocks = [];
  if (after > before) {
    for (let L = before + 1; L <= after; L++) {
      const rw = TIERS[L];
      if (rw && rw.skin && (!rw.premium || state.premium) && !state.unlocked.includes(rw.skin)) {
        state.unlocked.push(rw.skin);
        unlocks.push(rw.skin);
      }
    }
  }
  save();
  return { gained: amount, leveledTo: after > before ? after : null, unlocks };
}

export function buyPremium() {
  state.premium = true;
  const unlocks = [];
  for (let L = 1; L <= state.level; L++) {
    const rw = TIERS[L];
    if (rw && rw.skin && rw.premium && !state.unlocked.includes(rw.skin)) {
      state.unlocked.push(rw.skin);
      unlocks.push(rw.skin);
    }
  }
  save();
  return unlocks;
}
