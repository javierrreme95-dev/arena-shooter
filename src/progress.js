import { TIERS } from "./battlepass.js";

const KEY = "arena.progress.v2";
export const XP_PER = 300;
export const MAXLV = 12;
const DEFAULT_SKINS = ["estandar", "desertico", "urbano"];
const DEFAULT_DEATHS = ["explosion", "humo"];

function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }

let state = load() || {
  xp: 0, level: 1, premium: false,
  unlocked: DEFAULT_SKINS.slice(),
  unlockedDeaths: DEFAULT_DEATHS.slice(),
  equipped: "estandar",
  equippedDeath: "explosion",
  settings: { ally: "azul", enemy: "rojo", keySwitch: "q", keyReload: "r" },
};
if (!state.settings) state.settings = { ally: "azul", enemy: "rojo", keySwitch: "q", keyReload: "r" };
if (!state.unlockedDeaths) state.unlockedDeaths = DEFAULT_DEATHS.slice();
if (!state.settings.username) state.settings.username = "Jugador" + Math.floor(1000 + Math.random() * 9000);

function save() { localStorage.setItem(KEY, JSON.stringify(state)); }

export function getState() { return state; }
export function getEquipped() { return state.equipped; }
export function setEquipped(id) { state.equipped = id; save(); }
export function getEquippedDeath() { return state.equippedDeath; }
export function setEquippedDeath(id) { state.equippedDeath = id; save(); }
export function isUnlocked(id) { return state.unlocked.includes(id); }
export function isDeathUnlocked(id) { return state.unlockedDeaths.includes(id); }
export function isPremium() { return state.premium; }
export function getSetting(k) { return state.settings[k]; }
export function setSetting(k, v) { state.settings[k] = v; save(); }
export function getFriends() { if (!state.friends) state.friends = []; return state.friends; }
export function addFriend(name) { const f = getFriends(); if (name && !f.includes(name)) { f.push(name); save(); return true; } return false; }
export function removeFriend(name) { state.friends = getFriends().filter((n) => n !== name); save(); }

export function levelFromXp(xp) { return Math.min(MAXLV, Math.floor(xp / XP_PER) + 1); }
export function xpInLevel() { return state.xp - (state.level - 1) * XP_PER; }

function grant(rw, unlocks) {
  if (rw.skin && (!rw.premium || state.premium) && !state.unlocked.includes(rw.skin)) { state.unlocked.push(rw.skin); unlocks.push(rw.skin); }
  if (rw.death && !state.unlockedDeaths.includes(rw.death)) { state.unlockedDeaths.push(rw.death); unlocks.push(rw.death); }
}

export function addXP(amount) {
  const before = state.level;
  state.xp += amount;
  const after = levelFromXp(state.xp);
  state.level = after;
  const unlocks = [];
  if (after > before) for (let L = before + 1; L <= after; L++) { const rw = TIERS[L]; if (rw) grant(rw, unlocks); }
  save();
  return { gained: amount, leveledTo: after > before ? after : null, unlocks };
}

export function unlockAll(skinIds, deathIds) {
  state.premium = true;
  state.xp = (MAXLV - 1) * XP_PER;
  state.level = MAXLV;
  skinIds.forEach((id) => { if (!state.unlocked.includes(id)) state.unlocked.push(id); });
  deathIds.forEach((id) => { if (!state.unlockedDeaths.includes(id)) state.unlockedDeaths.push(id); });
  save();
}

export function buyPremium() {
  state.premium = true;
  const unlocks = [];
  for (let L = 1; L <= state.level; L++) { const rw = TIERS[L]; if (rw && rw.skin && rw.premium && !state.unlocked.includes(rw.skin)) { state.unlocked.push(rw.skin); unlocks.push(rw.skin); } }
  save();
  return unlocks;
}
