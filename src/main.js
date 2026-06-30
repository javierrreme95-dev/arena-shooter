import "./style.css";
import * as game from "./game.js";
import * as bp from "./battlepass.js";
import * as P from "./progress.js";
import { getSkin, getDeath, SKINS, DEATH_ANIMS } from "./skins.js";
import * as net from "./net.js";

const $ = (id) => document.getElementById(id);
const ALLY = { azul: "#378ADD", verde: "#5DCAA5" };
const ENEMY = { rojo: "#E24B4A", negro: "#0e131c" };

let toastT;
function toast(msg) { const t = $("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600); }

/* ---------- Router de pantallas ---------- */
function show(id) {
  document.body.classList.remove("playing");
  $("pause").classList.remove("on");
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("on"));
  $("s-" + id).classList.add("on");
  if (id === "skins") renderSkins();
  if (id === "pase") bp.renderBP($("bpbar"), $("bptrack"));
  if (id === "config") renderConfig();
  if (id === "controles") refreshBinds();
  if (id === "lobby" && lastRoom) showRoom(lastRoom);
}
function startPlaying() { document.body.classList.add("playing"); $("pause").classList.remove("on"); }

/* ---------- Navegación por data-go / data-act ---------- */
document.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => show(b.dataset.go)));
$("pase-btn").addEventListener("click", () => show("pase"));

document.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", () => act(b.dataset.act)));
let modeCtx = "local", flowCtx = "mm";
function act(a) {
  if (a === "quit") quit();
  else if (a === "local") { modeCtx = "local"; $("mode-title").textContent = "Jugar local"; $("mode-status").textContent = ""; show("mode"); }
  else if (a === "mm") { modeCtx = "mm"; flowCtx = "mm"; $("mode-title").textContent = "Matchmaking"; $("mode-status").textContent = ""; show("mode"); }
  else if (a === "custom") friendsRoom("custom");
  else if (a === "partymm") friendsRoom("partymm");
}
function quit() {
  try { window.close(); } catch {}
  toast("Para salir, cierra la pestaña o la app.");
}

/* ---------- Selección de modo + jugadores ---------- */
let selMode = "normal", selSize = 3;
$("mode-chips").querySelectorAll(".chip").forEach((c) => c.addEventListener("click", () => {
  $("mode-chips").querySelectorAll(".chip").forEach((x) => x.classList.remove("on")); c.classList.add("on"); selMode = c.dataset.mode;
}));
$("size-chips").querySelectorAll(".chip").forEach((c) => c.addEventListener("click", () => {
  $("size-chips").querySelectorAll(".chip").forEach((x) => x.classList.remove("on")); c.classList.add("on"); selSize = parseInt(c.dataset.size);
}));
$("mode-back").addEventListener("click", () => show("play"));
$("mode-confirm").addEventListener("click", async () => {
  if (modeCtx === "local") { game.start(selMode, { size: selSize, kill: 20 }); startPlaying(); }
  else if (modeCtx === "mm") {
    if (!(await ensureConnected())) return;
    $("mode-status").textContent = "Buscando jugadores…";
    net.send({ t: "match", name: P.getSetting("username"), mode: selMode, size: selSize });
  }
});

/* ---------- Jugar con amigos ---------- */
async function friendsRoom(kind) {
  if (!(await ensureConnected())) return;
  flowCtx = "amigos";
  net.send({ t: "create", name: P.getSetting("username"), mode: "normal", size: 3 });
  // la pantalla lobby se mostrará al recibir 'joined'
  if (kind === "partymm") toast("Invita a tus amigos y luego inicien la partida");
}

$("joinroom").addEventListener("click", async () => {
  const code = $("joincode").value.trim().toUpperCase();
  if (code.length !== 6) return toast("Escribe un código de 6 caracteres");
  if (!(await ensureConnected())) return;
  flowCtx = "amigos";
  net.send({ t: "join", code, name: P.getSetting("username") });
});

/* ---------- Lobby ---------- */
let lastRoom = null;
function showRoom(m) {
  lastRoom = m;
  $("roomcode2").textContent = net.roomCodeNow() || "------";
  const host = net.amHost();
  $("hostcfg").style.display = host ? "flex" : "none";
  $("startroom").style.display = host ? "block" : "none";
  const pl = $("roomplayers"); pl.innerHTML = "";
  m.players.forEach((p) => {
    const it = document.createElement("div"); it.className = "it";
    const tag = p.id === m.hostId ? " · anfitrión" : ""; const mine = p.id === net.myId() ? " (tú)" : "";
    it.innerHTML = "<b>" + p.name + mine + "</b><span class='muted'>" + tag + " · equipo " + (p.team || "?") + "</span>";
    pl.appendChild(it);
  });
}
$("copycode").addEventListener("click", () => { const c = net.roomCodeNow(); if (c) { navigator.clipboard?.writeText(c); toast("Código copiado: " + c); } });
$("wainvite").addEventListener("click", () => {
  const c = net.roomCodeNow(); if (!c) return;
  const txt = "¡Únete a mi partida en Arena Shooter! 🎮 Código: " + c + "  " + location.origin + "/?room=" + c;
  window.open("https://wa.me/?text=" + encodeURIComponent(txt), "_blank");
});
$("rmode").addEventListener("change", () => net.amHost() && net.send({ t: "config", mode: $("rmode").value, size: parseInt($("rsize").value) }));
$("rsize").addEventListener("change", () => net.amHost() && net.send({ t: "config", mode: $("rmode").value, size: parseInt($("rsize").value) }));
$("startroom").addEventListener("click", () => net.send({ t: "start" }));
$("leaveroom").addEventListener("click", () => { net.send({ t: "leave" }); lastRoom = null; show("amigos"); });

/* ---------- Red ---------- */
let netReady = false;
async function ensureConnected() {
  if (netReady) return true;
  try { await net.connect(); netReady = true; setupNet(); return true; }
  catch { toast("No hay servidor online disponible."); return false; }
}
function setupNet() {
  net.on("joined", () => { if (flowCtx === "amigos") show("lobby"); });
  net.on("room", (m) => { showRoom(m); });
  net.on("error", (m) => toast(m.msg));
  net.on("left", (m) => game.netLeft(m.id));
  net.on("state", (m) => game.netState(m.id, m.s));
  net.on("shot", (m) => game.netShot(m.id, m.x, m.y, m.ang));
  net.on("nade", (m) => game.netNade(m.id, m.tx, m.ty));
  net.on("start", (m) => {
    const myTeam = m.teams[net.myId()] || "A";
    game.startOnline({ mode: m.mode, size: m.size, myId: net.myId(), team: myTeam, name: P.getSetting("username"), send: (o) => net.send(o) });
    startPlaying();
    toast("¡Partida iniciada!");
  });
  net.on("close", () => { netReady = false; toast("Conexión cerrada"); });
}

/* ---------- Skins ---------- */
function renderSkins() { bp.renderSkins($("skingrid"), $("deathgrid"), renderSkins); }
$("buyprem").addEventListener("click", () => {
  if (P.isPremium()) return toast("Ya tienes el pase premium");
  const u = P.buyPremium(); toast(u.length ? "¡Premium! Skins nuevas: " + u.length : "¡Premium activado!");
  bp.renderBP($("bpbar"), $("bptrack"));
});

/* ---------- Configuración / swatches / binds / sensibilidad ---------- */
function buildSwatches(box, key) {
  box.innerHTML = "";
  const map = key === "ally" ? ALLY : ENEMY;
  Object.keys(map).forEach((name) => {
    const sw = document.createElement("div"); sw.className = "swatch" + (P.getSetting(key) === name ? " sel" : "");
    sw.style.background = map[name]; sw.title = name;
    sw.onclick = () => { P.setSetting(key, name); buildSwatches($("ally-colors"), "ally"); buildSwatches($("enemy-colors"), "enemy"); buildSwatches($("ally-colors2"), "ally"); buildSwatches($("enemy-colors2"), "enemy"); };
    box.appendChild(sw);
  });
}
function refreshBinds() {
  ["bind-sw", "bind-sw2"].forEach((i) => { if ($(i)) $(i).textContent = P.getSetting("keySwitch").toUpperCase(); });
  ["bind-rl", "bind-rl2"].forEach((i) => { if ($(i)) $(i).textContent = P.getSetting("keyReload").toUpperCase(); });
}
function bindKey(btn, settingKey) {
  if (!btn) return;
  btn.onclick = () => {
    btn.classList.add("listening"); btn.textContent = "…";
    const onKey = (e) => { e.preventDefault(); P.setSetting(settingKey, e.key.toLowerCase()); btn.classList.remove("listening"); window.removeEventListener("keydown", onKey, true); refreshBinds(); };
    window.addEventListener("keydown", onKey, true);
  };
}
function setSens(v) { P.setSetting("sensitivity", v); $("sens").value = v; $("sens2").value = v; $("sens-val").textContent = Math.round(v * 100) + "%"; $("sens-val2").textContent = Math.round(v * 100) + "%"; }
function renderConfig() {
  $("username").value = P.getSetting("username");
  setSens(P.getSetting("sensitivity"));
  buildSwatches($("ally-colors"), "ally"); buildSwatches($("enemy-colors"), "enemy");
  refreshBinds();
}
$("username").addEventListener("input", (e) => P.setSetting("username", e.target.value || "Jugador"));
$("sens").addEventListener("input", (e) => setSens(parseFloat(e.target.value)));
$("sens2").addEventListener("input", (e) => setSens(parseFloat(e.target.value)));
$("unlockall").addEventListener("click", () => { P.unlockAll(SKINS.map((s) => s.id), DEATH_ANIMS.map((d) => d.id)); toast("¡Todo desbloqueado! Equipa Chroma en Skins."); });
[["bind-sw", "keySwitch"], ["bind-rl", "keyReload"], ["bind-sw2", "keySwitch"], ["bind-rl2", "keyReload"]].forEach(([id, k]) => bindKey($(id), k));

/* ---------- Pausa ---------- */
function openPause() {
  $("pause").classList.add("on");
  setSens(P.getSetting("sensitivity"));
  buildSwatches($("ally-colors2"), "ally"); buildSwatches($("enemy-colors2"), "enemy");
  refreshBinds();
  $("exit-opts").style.display = "none";
}
function closePause() { $("pause").classList.remove("on"); }
$("resume").addEventListener("click", () => { game.setPaused(false); closePause(); });
$("exitgame").addEventListener("click", () => {
  if (game.partySize() > 0) { $("exit-opts").style.display = "block"; }
  else doExit();
});
$("exit-party").addEventListener("click", () => doExit());
$("exit-solo").addEventListener("click", () => doExit());
function doExit() { game.exitGame(); closePause(); document.body.classList.remove("playing"); show(net.connected() && lastRoom ? "lobby" : "play"); }

/* ---------- Init ---------- */
game.init($("g"), {
  kill: () => P.addXP(50),
  win: () => P.addXP(200),
  match: () => P.addXP(60),
  pause: (p) => (p ? openPause() : closePause()),
});

// Auto-unirse por link ?room=CODE
const urlRoom = new URLSearchParams(location.search).get("room");
if (urlRoom) { flowCtx = "amigos"; ensureConnected().then((ok) => { if (ok) net.send({ t: "join", code: urlRoom.toUpperCase(), name: P.getSetting("username") }); }); }

show("main");

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}
