import { SKINS, DEATH_ANIMS, RARITY_COLOR, drawSoldierPreview, drawDeathPreview } from "./skins.js";
import * as P from "./progress.js";

export const TIERS = {
  1: { label: "Bienvenida" },
  2: { label: "+ XP" },
  3: { label: "Skin Nieve", skin: "nieve" },
  4: { label: "Anim. Sangre", death: "sangre" },
  5: { label: "Skin Selva", skin: "selva" },
  6: { label: "+ XP" },
  7: { label: "Skin Acero", skin: "acero", premium: true },
  8: { label: "Anim. Pixeles", death: "pixeles" },
  9: { label: "Skin Oro", skin: "oro", premium: true },
  10: { label: "+ XP" },
  11: { label: "Emblema" },
  12: { label: "Skin Chroma", skin: "chroma", premium: true },
};

function skinUnlockLabel(id) { for (const L in TIERS) if (TIERS[L].skin === id) return (TIERS[L].premium ? "Premium nv " : "Nivel ") + L; return "Inicial"; }
function deathUnlockLabel(id) { for (const L in TIERS) if (TIERS[L].death === id) return "Nivel " + L; return "Inicial"; }

function mkCanvas(size) { const c = document.createElement("canvas"); c.width = size; c.height = size; return c; }

export function renderSkins(charGrid, deathGrid, refresh) {
  charGrid.innerHTML = "";
  SKINS.forEach((s) => {
    const unlocked = P.isUnlocked(s.id), eq = P.getEquipped() === s.id;
    const card = document.createElement("div"); card.className = "card";
    const cv = mkCanvas(70); card.appendChild(cv); drawSoldierPreview(cv, s.id);
    const nm = document.createElement("div"); nm.className = "nm"; nm.textContent = s.name; card.appendChild(nm);
    const rar = document.createElement("div"); rar.className = "rar"; rar.textContent = s.rarity; rar.style.color = RARITY_COLOR[s.rarity]; card.appendChild(rar);
    const btn = document.createElement("button");
    if (eq) { btn.textContent = "Equipado"; btn.className = "btn-equipped"; }
    else if (unlocked) { btn.textContent = "Equipar"; btn.className = "btn-equip"; btn.onclick = () => { P.setEquipped(s.id); refresh(); }; }
    else { btn.textContent = "🔒 " + skinUnlockLabel(s.id); btn.className = "btn-locked"; btn.disabled = true; }
    card.appendChild(btn); charGrid.appendChild(card);
  });

  deathGrid.innerHTML = "";
  DEATH_ANIMS.forEach((d) => {
    const unlocked = P.isDeathUnlocked(d.id), eq = P.getEquippedDeath() === d.id;
    const card = document.createElement("div"); card.className = "card";
    const cv = mkCanvas(70); card.appendChild(cv); drawDeathPreview(cv, d.id);
    const nm = document.createElement("div"); nm.className = "nm"; nm.textContent = d.name; card.appendChild(nm);
    const btn = document.createElement("button");
    if (eq) { btn.textContent = "Equipado"; btn.className = "btn-equipped"; }
    else if (unlocked) { btn.textContent = "Equipar"; btn.className = "btn-equip"; btn.onclick = () => { P.setEquippedDeath(d.id); refresh(); }; }
    else { btn.textContent = "🔒 " + deathUnlockLabel(d.id); btn.className = "btn-locked"; btn.disabled = true; }
    card.appendChild(btn); deathGrid.appendChild(card);
  });
}

export function renderBP(bar, track) {
  const st = P.getState();
  bar.innerHTML = "";
  const fill = document.createElement("div"); fill.style.width = Math.round((P.xpInLevel() / P.XP_PER) * 100) + "%"; bar.appendChild(fill);
  track.innerHTML = "";
  for (let L = 1; L <= P.MAXLV; L++) {
    const rw = TIERS[L] || { label: "—" };
    const t = document.createElement("div");
    t.className = "tier" + (L < st.level ? " done" : "") + (L === st.level ? " cur" : "");
    const tn = document.createElement("div"); tn.className = "tn"; tn.textContent = "Nivel " + L; t.appendChild(tn);
    if (rw.skin) { const cv = mkCanvas(54); t.appendChild(cv); drawSoldierPreview(cv, rw.skin); }
    else if (rw.death) { const cv = mkCanvas(54); t.appendChild(cv); drawDeathPreview(cv, rw.death); }
    else { const sp = document.createElement("div"); sp.style.height = "54px"; sp.style.lineHeight = "54px"; sp.style.fontSize = "22px"; sp.textContent = L <= st.level ? "✓" : "·"; t.appendChild(sp); }
    const rl = document.createElement("div"); rl.className = "rl"; rl.textContent = rw.label || ""; t.appendChild(rl);
    if (rw.premium) { const pr = document.createElement("div"); pr.className = "prem"; pr.textContent = "Premium"; t.appendChild(pr); }
    track.appendChild(t);
  }
}
