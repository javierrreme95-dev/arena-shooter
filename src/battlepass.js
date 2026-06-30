import { SKINS, getSkin, drawSkin, RARITY_COLOR } from "./skins.js";
import * as P from "./progress.js";

export const TIERS = {
  1: { label: "Bienvenida" },
  2: { label: "+ XP" },
  3: { label: "Skin", skin: "naranja", premium: false },
  4: { label: "Emote" },
  5: { label: "Skin", skin: "morado", premium: false },
  6: { label: "+ XP" },
  7: { label: "Skin", skin: "cian", premium: true },
  8: { label: "Color" },
  9: { label: "Skin", skin: "dorado", premium: true },
  10: { label: "+ XP" },
  11: { label: "Skin", skin: "calavera", premium: true },
  12: { label: "Maestro" },
};

function unlockLabel(skinId) {
  for (const L in TIERS) {
    if (TIERS[L].skin === skinId) return (TIERS[L].premium ? "Premium nivel " : "Nivel ") + L;
  }
  return "Inicial";
}

function preview(skinId, size) {
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  drawSkin(c.getContext("2d"), size / 2, size / 2, size / 2 - 6, getSkin(skinId));
  return c;
}

export function renderSkins(grid, refresh) {
  grid.innerHTML = "";
  SKINS.forEach((s) => {
    const unlocked = P.isUnlocked(s.id);
    const equipped = P.getEquipped() === s.id;
    const card = document.createElement("div");
    card.className = "card";
    card.appendChild(preview(s.id, 70));
    const nm = document.createElement("div"); nm.className = "nm"; nm.textContent = s.name; card.appendChild(nm);
    const rar = document.createElement("div"); rar.className = "rar"; rar.textContent = s.rarity;
    rar.style.color = RARITY_COLOR[s.rarity]; card.appendChild(rar);
    const btn = document.createElement("button");
    if (equipped) { btn.textContent = "Equipado"; btn.className = "btn-equipped"; }
    else if (unlocked) {
      btn.textContent = "Equipar"; btn.className = "btn-equip";
      btn.onclick = () => { P.setEquipped(s.id); refresh(); };
    } else {
      btn.textContent = "🔒 " + unlockLabel(s.id); btn.className = "btn-locked"; btn.disabled = true;
    }
    card.appendChild(btn);
    grid.appendChild(card);
  });
}

export function renderBP(bar, track, refresh) {
  const st = P.getState();
  bar.innerHTML = "";
  const fill = document.createElement("div");
  fill.style.width = Math.round((P.xpInLevel() / P.XP_PER) * 100) + "%";
  bar.appendChild(fill);

  track.innerHTML = "";
  for (let L = 1; L <= P.MAXLV; L++) {
    const rw = TIERS[L] || { label: "—" };
    const t = document.createElement("div");
    t.className = "tier" + (L < st.level ? " done" : "") + (L === st.level ? " cur" : "");
    const tn = document.createElement("div"); tn.className = "tn"; tn.textContent = "Nivel " + L; t.appendChild(tn);
    if (rw.skin) t.appendChild(preview(rw.skin, 54));
    else { const sp = document.createElement("div"); sp.style.height = "54px"; sp.style.lineHeight = "54px"; sp.style.fontSize = "22px"; sp.textContent = L <= st.level ? "✓" : "·"; t.appendChild(sp); }
    const rl = document.createElement("div"); rl.className = "rl"; rl.textContent = rw.label || ""; t.appendChild(rl);
    if (rw.premium) { const pr = document.createElement("div"); pr.className = "prem"; pr.textContent = "Premium"; t.appendChild(pr); }
    track.appendChild(t);
  }
}
