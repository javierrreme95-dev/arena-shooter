import { getSkin, drawSkin, randomBotSkin } from "./skins.js";
import { getEquipped } from "./progress.js";

let cv, ctx, W, H, cb = {};
let mode = "normal", state = "menu";
let ents = [], bullets = [], nades = [], pups = [], parts = [], rings = [], floats = [], feed = [];
let scoreA = 0, scoreB = 0, cfgKill = 15, timer = 0, hill = null, flag = null, ctfTurns = [], ctfIdx = 0, pupT = 0, hillMove = 0, over = null;
const keys = {}, mouse = { x: 330, y: 230, down: false };
const walls = [
  { x: 300, y: 70, w: 60, h: 90 }, { x: 300, y: 300, w: 60, h: 90 },
  { x: 120, y: 200, w: 90, h: 55 }, { x: 450, y: 200, w: 90, h: 55 },
];

const rnd = (a, b) => a + Math.random() * (b - a);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const inR = (x, y, r) => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h;
function los(a, b) {
  for (let t = 0; t <= 1; t += 0.06) {
    const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
    for (const w of walls) if (inR(x, y, w)) return true;
  }
  return false;
}
function spawn(team) {
  const lft = team === "A" || team === "S" || team === "P";
  let x = lft ? rnd(30, 90) : team === "B" ? rnd(W - 90, W - 30) : rnd(60, W - 60), y = rnd(40, H - 40), n = 0;
  while (n++ < 60) { let ok = true; for (const w of walls) if (inR(x, y, w)) { ok = false; break; } if (ok) break; x = rnd(60, W - 60); y = rnd(40, H - 40); }
  return { x, y };
}
function mkE(team, isP, smul, name) {
  const p = spawn(team);
  return { x: p.x, y: p.y, r: 12, team, isP, name, hp: 100, aim: 0, cd: 0, alive: true, resp: 0, kills: 0, points: 0, smul: smul || 1, bf: { fire: 0, sh: 0, bl: 0 }, shp: 0, wp: "gun", gr: 0, carry: false, skin: isP ? getEquipped() : randomBotSkin() };
}
function isEnemy(a, b) { if (mode === "koth") return a !== b; return a.team !== b.team; }
function nEnemy(e) { let best = null, bd = 1e9; for (const o of ents) if (o.alive && isEnemy(e, o)) { const d = dist(e, o); if (d < bd) { bd = d; best = o; } } return best; }
function playerEnt() { return ents.find((e) => e.isP); }

export function init(canvas, callbacks) {
  cv = canvas; ctx = cv.getContext("2d"); W = cv.width; H = cv.height; cb = callbacks || {};
  window.addEventListener("keydown", (e) => { const k = e.key.toLowerCase(); keys[k] = true; const me = playerEnt(); if (me) { if (k === "1") me.wp = "gun"; if (k === "2" && me.gr > 0) me.wp = "nade"; } if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault(); });
  window.addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });
  const mp = (ev) => { const rc = cv.getBoundingClientRect(), sx = cv.width / rc.width, sy = cv.height / rc.height; const c = ev.touches ? ev.touches[0] : ev; mouse.x = (c.clientX - rc.left) * sx; mouse.y = (c.clientY - rc.top) * sy; };
  cv.addEventListener("mousemove", mp);
  cv.addEventListener("mousedown", (e) => { cv.focus(); mp(e); mouse.down = true; });
  window.addEventListener("mouseup", () => { mouse.down = false; });
  cv.addEventListener("touchstart", (e) => { mp(e); mouse.down = true; e.preventDefault(); }, { passive: false });
  cv.addEventListener("touchmove", (e) => { mp(e); e.preventDefault(); }, { passive: false });
  cv.addEventListener("touchend", () => { mouse.down = false; });
  requestAnimationFrame(loop);
}

export function start(m, cfg) {
  mode = m; bullets = []; nades = []; pups = []; parts = []; rings = []; floats = []; feed = [];
  over = null; scoreA = 0; scoreB = 0; timer = 0; flag = null; hill = null; pupT = 2; hillMove = 0;
  cfgKill = (cfg && cfg.kill) || 15;
  if (m === "normal") {
    const s = (cfg && cfg.size) || 3;
    ents = [mkE("A", true, 1, "TÚ")];
    for (let i = 1; i < s; i++) ents.push(mkE("A", false, 1, "Aliado " + i));
    for (let j = 0; j < s; j++) ents.push(mkE("B", false, 1, "Rojo " + (j + 1)));
  } else if (m === "ctf") {
    ents = [mkE("A", true, 1, "TÚ")];
    for (let i = 1; i < 3; i++) ents.push(mkE("A", false, 1, "Aliado " + i));
    for (let j = 0; j < 3; j++) ents.push(mkE("B", false, 1, "Rojo " + (j + 1)));
    ctfTurns = ["A", "B", "A", "B", "A", "B"]; ctfIdx = 0; timer = 90; newFlag();
  } else if (m === "koth") {
    ents = [mkE("P", true, 1, "TÚ")];
    for (let i = 0; i < 5; i++) ents.push(mkE("FFA" + i, false, 1, "Bot " + (i + 1)));
    hill = { x: W / 2, y: H / 2, r: 55 }; hillMove = 18;
  } else if (m === "inf") {
    ents = [mkE("Z", false, 1.5, "Infectado")]; ents[0].wp = "none";
    ents.push(mkE("S", true, 1, "TÚ"));
    for (let i = 0; i < 8; i++) ents.push(mkE("S", false, 1, "Humano " + (i + 1)));
    timer = 60;
  }
  state = "play"; cv.focus();
}

function newFlag() { const at = ctfTurns[ctfIdx]; flag = { x: at === "A" ? 20 : W - 20, y: H / 2, carrier: null, att: at }; }
function fcd(e) { return (e.bf.fire > 0 ? 0.09 : 0.18) * (e.isP ? 1 : 3.2); }
function fire(e, ang) { bullets.push({ x: e.x + Math.cos(ang) * 16, y: e.y + Math.sin(ang) * 16, vx: Math.cos(ang) * 440, vy: Math.sin(ang) * 440, team: e.team, by: e, life: 1.4 }); }
function throwNade(e) { if (e.gr <= 0) return; e.gr--; const ang = e.aim, d = Math.min(220, dist(e, { x: mouse.x, y: mouse.y })); nades.push({ x: e.x, y: e.y, tx: e.x + Math.cos(ang) * d, ty: e.y + Math.sin(ang) * d, t: 0.7, team: e.team }); }
function hurt(e, dmg, by) { if (e.bf.sh > 0 && e.shp > 0) { e.shp -= dmg; if (e.shp < 0) { e.hp += e.shp; e.shp = 0; } } else e.hp -= dmg; if (e.hp <= 0 && e.alive) die(e, by); }

function spawnDeath(e) {
  const col = getSkin(e.skin).body;
  for (let i = 0; i < 16; i++) { const a = rnd(0, 6.28), s = rnd(40, 180); parts.push({ x: e.x, y: e.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(0.4, 0.8), col }); }
  rings.push({ x: e.x, y: e.y, r: 6, max: 36, life: 0.4, col });
}
function die(e, by) {
  e.alive = false; e.carry = false;
  spawnDeath(e);
  if (by) feed.unshift({ txt: by.name + " ▸ " + e.name, life: 4 }); if (feed.length > 5) feed.pop();
  if (by && by.isP) floats.push({ x: e.x, y: e.y, txt: "+50", life: 1, col: "#FAC775" });
  if (mode === "normal") {
    if (by) { if (by.team === "A") scoreA++; else scoreB++; }
    e.resp = 2.5;
    if (scoreA >= cfgKill) endGame("Ganó Azul"); if (scoreB >= cfgKill) endGame("Ganó Rojo");
  } else if (mode === "koth") { if (by) by.kills++; e.resp = 1.8; }
  else if (mode === "ctf") { e.resp = 2; if (flag && flag.carrier === e) { flag.carrier = null; flag.x = flag.att === "A" ? 20 : W - 20; flag.y = H / 2; } }
  else if (mode === "inf") { e.resp = 2; }
}
function pickup(e, ty) {
  if (ty === "fire") e.bf.fire = 6;
  else if (ty === "nade") e.gr += 2;
  else if (ty === "shield") { e.bf.sh = 6; e.shp = 60; }
  else if (ty === "revive") { for (const o of ents) if (o.team === e.team && !o.alive) { o.alive = true; o.hp = 100; o.resp = 0; const p = spawn(o.team); o.x = p.x; o.y = p.y; break; } }
  else if (ty === "blind") { for (const o of ents) if (isEnemy(e, o)) o.bf.bl = 5; }
}
function moveC(e, dx, dy) {
  let nx = e.x + dx; if (nx > e.r && nx < W - e.r) { let h = false; for (const r of walls) if (nx + e.r > r.x && nx - e.r < r.x + r.w && e.y + e.r > r.y && e.y - e.r < r.y + r.h) { h = true; break; } if (!h) e.x = nx; }
  let ny = e.y + dy; if (ny > e.r && ny < H - e.r) { let h = false; for (const r of walls) if (e.x + e.r > r.x && e.x - e.r < r.x + r.w && ny + e.r > r.y && ny - e.r < r.y + r.h) { h = true; break; } if (!h) e.y = ny; }
}
let ended = false;
function endGame(text) { if (over) return; over = text; const me = playerEnt(); let won; if (mode === "koth") won = text.indexOf("Ganaste") >= 0; else if (mode === "inf") won = me.team === "S" ? text.indexOf("Sobrevivieron") >= 0 : text.indexOf("infectados") >= 0; else won = text.indexOf("Azul") >= 0; if (won) cb.win && cb.win(); else cb.match && cb.match(); }
function nextTurn() { ctfIdx++; if (ctfIdx >= ctfTurns.length) { endGame(scoreA > scoreB ? "Ganó Azul (bandera)" : scoreB > scoreA ? "Ganó Rojo (bandera)" : "Empate"); return; } timer = 90; newFlag(); }

function ctfBot(e, dt) {
  const sp = 150 * e.smul, att = flag && flag.att === e.team, tg = nEnemy(e);
  if (att) {
    let aim;
    if (flag.carrier === e) { const tx = e.team === "A" ? W - 20 : 20; aim = Math.atan2(H / 2 - e.y, tx - e.x); }
    else if (!flag.carrier) aim = Math.atan2(flag.y - e.y, flag.x - e.x);
    else aim = tg ? Math.atan2(tg.y - e.y, tg.x - e.x) : 0;
    moveC(e, Math.cos(aim) * sp * 0.8 * dt, Math.sin(aim) * sp * 0.8 * dt);
    if (tg) { e.aim = Math.atan2(tg.y - e.y, tg.x - e.x); if (dist(e, tg) < 320 && !los(e, tg) && e.cd <= 0) { fire(e, e.aim); e.cd = fcd(e); } }
  } else if (tg) {
    const d = dist(e, tg), a = Math.atan2(tg.y - e.y, tg.x - e.x); e.aim = a;
    moveC(e, (d > 220 ? Math.cos(a) : -Math.cos(a) * 0.4) * sp * 0.7 * dt, (d > 220 ? Math.sin(a) : -Math.sin(a) * 0.4) * sp * 0.7 * dt);
    if (d < 340 && !los(e, tg) && e.cd <= 0) { fire(e, a + rnd(-0.1, 0.1)); e.cd = fcd(e); }
  }
}

function update(dt) {
  for (const f of parts) { f.x += f.vx * dt; f.y += f.vy * dt; f.life -= dt; }
  for (let i = parts.length - 1; i >= 0; i--) if (parts[i].life <= 0) parts.splice(i, 1);
  for (const rg of rings) { rg.r += (rg.max - rg.r) * dt * 8; rg.life -= dt; }
  for (let i = rings.length - 1; i >= 0; i--) if (rings[i].life <= 0) rings.splice(i, 1);
  for (const ft of floats) { ft.y -= 28 * dt; ft.life -= dt; }
  for (let i = floats.length - 1; i >= 0; i--) if (floats[i].life <= 0) floats.splice(i, 1);
  for (const fe of feed) fe.life -= dt;
  for (let i = feed.length - 1; i >= 0; i--) if (feed[i].life <= 0) feed.splice(i, 1);

  if (state !== "play" || over) return;

  if (mode === "koth") { hillMove -= dt; if (hillMove <= 0) { hillMove = 18; hill.x = rnd(120, W - 120); hill.y = rnd(90, H - 90); } }
  if (mode === "ctf" || mode === "inf") { timer -= dt; if (timer <= 0) { if (mode === "ctf") nextTurn(); else { const sv = ents.filter((o) => o.team === "S").length; endGame(sv > 0 ? "Sobrevivieron los humanos" : "Ganaron los infectados"); } } }
  if (mode === "normal") { pupT -= dt; if (pupT <= 0 && pups.length < 4) { pupT = 5; const ty = ["fire", "nade", "shield", "revive", "blind"][Math.floor(rnd(0, 5))]; const p = spawn("mid"); pups.push({ x: p.x, y: p.y, ty }); } }

  for (const e of ents) {
    if (!e.alive) { e.resp -= dt; if (e.resp <= 0) { e.alive = true; e.hp = 100; const p = spawn(e.team); e.x = p.x; e.y = p.y; } continue; }
    for (const k in e.bf) if (e.bf[k] > 0) e.bf[k] -= dt;
    const sp = 150 * e.smul;
    if (e.isP) {
      let dx = 0, dy = 0;
      if (keys.w || keys.arrowup) dy--; if (keys.s || keys.arrowdown) dy++; if (keys.a || keys.arrowleft) dx--; if (keys.d || keys.arrowright) dx++;
      const m = Math.hypot(dx, dy) || 1; moveC(e, (dx / m) * sp * dt, (dy / m) * sp * dt);
      e.aim = Math.atan2(mouse.y - e.y, mouse.x - e.x); e.cd -= dt;
      if (mouse.down && e.cd <= 0 && e.wp !== "none") { if (e.wp === "nade") { throwNade(e); e.cd = 0.5; if (e.gr === 0) e.wp = "gun"; } else { fire(e, e.aim); e.cd = fcd(e); } }
    } else {
      e.cd -= dt; const tg = nEnemy(e);
      if (mode === "inf" && e.team === "Z") { if (tg) { const a = Math.atan2(tg.y - e.y, tg.x - e.x); e.aim = a; moveC(e, Math.cos(a) * sp * dt, Math.sin(a) * sp * dt); } }
      else if (mode === "ctf") ctfBot(e, dt);
      else if (tg) {
        const d = dist(e, tg), a = Math.atan2(tg.y - e.y, tg.x - e.x); e.aim = a;
        let mx, my; if (d > 240) { mx = Math.cos(a); my = Math.sin(a); } else if (d < 150) { mx = -Math.cos(a); my = -Math.sin(a); } else { mx = Math.cos(a + 1.57) * 0.7; my = Math.sin(a + 1.57) * 0.7; }
        moveC(e, mx * sp * 0.8 * dt, my * sp * 0.8 * dt);
        const rng = e.bf.bl > 0 ? 160 : 360;
        if (e.wp !== "none" && d < rng && !los(e, tg) && e.cd <= 0) { fire(e, a + rnd(-0.1, 0.1)); e.cd = fcd(e); }
      }
    }
    if (mode === "inf" && e.team === "Z") for (const o of ents) if (o.team === "S" && o.alive && dist(e, o) < e.r + o.r + 2) { o.team = "Z"; o.smul = 1.5; o.wp = "none"; o.skin = "verde"; }
    if (mode === "koth" && hill) { const inside = ents.filter((o) => o.alive && dist(o, hill) < hill.r); if (inside.length === 1) inside[0].points += dt; }
    if (mode === "ctf" && flag) {
      if (!flag.carrier && e.team === flag.att && dist(e, flag) < e.r + 8) { flag.carrier = e; e.carry = true; }
      if (flag.carrier === e) { flag.x = e.x; flag.y = e.y; const tgt = flag.att === "A" ? W - 20 : 20; if (Math.abs(e.x - tgt) < 30) { if (flag.att === "A") scoreA++; else scoreB++; nextTurn(); } }
    }
  }
  if (mode === "koth") for (const e of ents) if (e.points >= 50) endGame((e.isP ? "¡Ganaste!" : "Ganó un bot") + " (Rey de la colina)");
  if (mode === "inf" && ents.filter((o) => o.team === "S").length === 0) endGame("Ganaron los infectados");

  for (let b = bullets.length - 1; b >= 0; b--) {
    const bl = bullets[b]; bl.x += bl.vx * dt; bl.y += bl.vy * dt; bl.life -= dt;
    let dead = bl.life <= 0 || bl.x < 0 || bl.x > W || bl.y < 0 || bl.y > H;
    if (!dead) for (const w of walls) if (inR(bl.x, bl.y, w)) { dead = true; break; }
    if (!dead) for (const e2 of ents) if (e2.alive && e2 !== bl.by && isEnemy(bl.by, e2) && dist(e2, bl) < e2.r) { hurt(e2, 22, bl.by); dead = true; break; }
    if (dead) bullets.splice(b, 1);
  }
  for (let n = nades.length - 1; n >= 0; n--) {
    const nd = nades[n]; nd.t -= dt; nd.x += (nd.tx - nd.x) * Math.min(1, dt * 4); nd.y += (nd.ty - nd.y) * Math.min(1, dt * 4);
    if (nd.t <= 0) { rings.push({ x: nd.x, y: nd.y, r: 8, max: 60, life: 0.35, col: "#FAC775" }); for (const e3 of ents) if (e3.alive && e3.team !== nd.team && dist(e3, nd) < 60) hurt(e3, 55, null); nades.splice(n, 1); }
  }
  for (let p = pups.length - 1; p >= 0; p--) for (const e4 of ents) if (e4.alive && dist(e4, pups[p]) < e4.r + 8) { pickup(e4, pups[p].ty); pups.splice(p, 1); break; }
}

const PC = { fire: "#EF9F27", nade: "#888780", shield: "#5DCAA5", revive: "#ED93B1", blind: "#7F77DD" };
function col(o) { if (mode === "koth") return o.isP ? "#378ADD" : "#E24B4A"; if (mode === "inf") return o.team === "Z" ? "#97C459" : o.isP ? "#378ADD" : "#85B7EB"; return o.team === "A" ? "#378ADD" : "#E24B4A"; }

function draw() {
  ctx.clearRect(0, 0, W, H);
  if (state === "menu") {
    ctx.fillStyle = "#cdd6ee"; ctx.textAlign = "center"; ctx.font = "600 22px sans-serif";
    ctx.fillText("Elige un modo arriba para jugar", W / 2, H / 2 - 6);
    ctx.font = "14px sans-serif"; ctx.fillStyle = "#8fa0c8";
    ctx.fillText("Tus skins se ven en la partida · gana XP para subir tu pase", W / 2, H / 2 + 20);
    return;
  }
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  for (let gx = 0; gx < W; gx += 44) ctx.fillRect(gx, 0, 1, H);
  for (let gy = 0; gy < H; gy += 44) ctx.fillRect(0, gy, W, 1);
  if (mode === "ctf") { ctx.fillStyle = "rgba(55,138,221,0.18)"; ctx.fillRect(0, H / 2 - 55, 42, 110); ctx.fillStyle = "rgba(226,75,74,0.18)"; ctx.fillRect(W - 42, H / 2 - 55, 42, 110); }
  if (mode === "koth" && hill) { const ins = ents.filter((o) => o.alive && dist(o, hill) < hill.r); ctx.fillStyle = ins.length === 1 ? "rgba(93,202,165,0.22)" : "rgba(239,159,39,0.18)"; ctx.beginPath(); ctx.arc(hill.x, hill.y, hill.r, 0, 6.283); ctx.fill(); ctx.strokeStyle = ins.length === 1 ? "#5DCAA5" : "#EF9F27"; ctx.lineWidth = 2; ctx.stroke(); }
  ctx.fillStyle = "#2c3b63"; for (const r of walls) ctx.fillRect(r.x, r.y, r.w, r.h);
  for (const pu of pups) { ctx.fillStyle = PC[pu.ty]; ctx.fillRect(pu.x - 8, pu.y - 8, 16, 16); ctx.fillStyle = "#16203a"; ctx.font = "700 11px sans-serif"; ctx.textAlign = "center"; ctx.fillText(pu.ty[0].toUpperCase(), pu.x, pu.y + 4); }
  for (const nd of nades) { ctx.fillStyle = "#cfcfc6"; ctx.beginPath(); ctx.arc(nd.x, nd.y, 5, 0, 6.283); ctx.fill(); }
  for (const bl of bullets) { ctx.fillStyle = "#ffe8a0"; ctx.beginPath(); ctx.arc(bl.x, bl.y, 3, 0, 6.283); ctx.fill(); }
  if (mode === "ctf" && flag) { ctx.fillStyle = "#FAC775"; ctx.fillRect(flag.x - 2, flag.y - 16, 3, 16); ctx.beginPath(); ctx.moveTo(flag.x + 1, flag.y - 16); ctx.lineTo(flag.x + 14, flag.y - 12); ctx.lineTo(flag.x + 1, flag.y - 8); ctx.fill(); }

  for (const o of ents) {
    if (!o.alive) continue;
    drawSkin(ctx, o.x, o.y, o.r, getSkin(o.skin));
    ctx.strokeStyle = col(o); ctx.lineWidth = o.isP ? 3.5 : 2.5; ctx.beginPath(); ctx.arc(o.x, o.y, o.r + 1, 0, 6.283); ctx.stroke();
    if (o.bf.sh > 0 && o.shp > 0) { ctx.strokeStyle = "#5DCAA5"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(o.x, o.y, o.r + 5, 0, 6.283); ctx.stroke(); }
    if (o.wp !== "none") { ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + Math.cos(o.aim) * 18, o.y + Math.sin(o.aim) * 18); ctx.stroke(); }
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(o.x - 14, o.y - 24, 28, 4); ctx.fillStyle = "#5DCAA5"; ctx.fillRect(o.x - 14, o.y - 24, (28 * Math.max(0, o.hp)) / 100, 4);
    if (mode === "koth") { ctx.fillStyle = "#fff"; ctx.font = "10px sans-serif"; ctx.textAlign = "center"; ctx.fillText(Math.floor(o.points), o.x, o.y - 28); }
  }

  for (const rg of rings) { ctx.globalAlpha = Math.max(0, rg.life * 2); ctx.strokeStyle = rg.col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(rg.x, rg.y, rg.r, 0, 6.283); ctx.stroke(); ctx.globalAlpha = 1; }
  for (const f of parts) { ctx.globalAlpha = Math.max(0, f.life); ctx.fillStyle = f.col; ctx.fillRect(f.x - 2, f.y - 2, 4, 4); ctx.globalAlpha = 1; }
  for (const ft of floats) { ctx.globalAlpha = Math.max(0, ft.life); ctx.fillStyle = ft.col; ctx.font = "700 16px sans-serif"; ctx.textAlign = "center"; ctx.fillText(ft.txt, ft.x, ft.y); ctx.globalAlpha = 1; }

  ctx.textAlign = "right"; ctx.font = "12px sans-serif";
  for (let i = 0; i < feed.length; i++) { ctx.globalAlpha = Math.min(1, feed[i].life); ctx.fillStyle = "#dbe3f5"; ctx.fillText(feed[i].txt, W - 8, 16 + i * 16); ctx.globalAlpha = 1; }

  const me = playerEnt();
  if (me && me.alive && me.bf.bl > 0) { const g = ctx.createRadialGradient(me.x, me.y, 40, me.x, me.y, 260); g.addColorStop(0, "rgba(10,12,24,0)"); g.addColorStop(1, "rgba(8,10,20,0.92)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }

  if (over) { ctx.fillStyle = "rgba(10,14,28,0.8)"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#fff"; ctx.font = "600 28px sans-serif"; ctx.textAlign = "center"; ctx.fillText(over, W / 2, H / 2); ctx.fillStyle = "#cdd6ee"; ctx.font = "14px sans-serif"; ctx.fillText("Elige un modo arriba para jugar otra vez", W / 2, H / 2 + 28); }
  hud();
}

function hud() {
  const hl = document.getElementById("hl"), hr = document.getElementById("hr");
  if (!hl) return;
  if (state === "menu") { hl.textContent = ""; hr.textContent = ""; return; }
  if (mode === "normal") { hl.innerHTML = '<b style="color:#378ADD">Azul</b> ' + scoreA + " — " + scoreB + ' <b style="color:#E24B4A">Rojo</b> · meta ' + cfgKill; hr.textContent = "1/2 cambia arma·granada"; }
  else if (mode === "ctf") { hl.innerHTML = '<b style="color:#378ADD">Azul</b> ' + scoreA + " — " + scoreB + ' <b style="color:#E24B4A">Rojo</b>'; hr.textContent = "Ataca " + (ctfTurns[ctfIdx] === "A" ? "Azul" : "Rojo") + " · " + Math.ceil(timer) + "s (" + (ctfIdx + 1) + "/6)"; }
  else if (mode === "koth") { const top = ents.slice().sort((a, b) => b.points - a.points)[0]; hl.textContent = "Rey de la colina · meta 50"; hr.textContent = "Líder: " + (top.isP ? "TÚ" : "bot") + " " + Math.floor(top.points); }
  else if (mode === "inf") { hl.textContent = "Infección · humanos vivos: " + ents.filter((o) => o.team === "S").length; hr.textContent = "Tiempo: " + Math.ceil(timer) + "s"; }
}

let last = 0;
function loop(t) { const dt = Math.min(0.04, (t - last) / 1000) || 0; last = t; update(dt); draw(); requestAnimationFrame(loop); }
