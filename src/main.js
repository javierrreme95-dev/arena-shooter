import "./style.css";
import * as game from "./game.js";
import * as bp from "./battlepass.js";
import * as P from "./progress.js";
import { getSkin, getDeath, SKINS, DEATH_ANIMS } from "./skins.js";
import * as net from "./net.js";

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
  renderFriends();
  if ($("username")) $("username").value = P.getSetting("username");
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

// ---- Hub (Local / Amigos / Matchmaking) ----
document.querySelectorAll(".hubb").forEach((b) => {
  b.addEventListener("click", () => {
    document.querySelectorAll(".hubb").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    ["local", "friends", "match"].forEach((s) => { $("sub-" + s).style.display = b.dataset.sub === s ? "block" : "none"; });
    if (b.dataset.sub !== "local") ensureConnected();
  });
});

$("username").addEventListener("input", (e) => { P.setSetting("username", e.target.value || "Jugador"); });
$("addfriend").addEventListener("click", () => {
  const n = $("friendname").value.trim();
  if (P.addFriend(n)) { $("friendname").value = ""; renderFriends(); toast("Amigo agregado: " + n); }
  else toast("Escribe un usuario válido (o ya está en tu lista)");
});
function renderFriends() {
  const fl = $("friendlist"); if (!fl) return; fl.innerHTML = "";
  const friends = P.getFriends();
  if (!friends.length) { const e = document.createElement("div"); e.className = "card"; e.innerHTML = '<span class="muted">Sin amigos aún</span>'; fl.appendChild(e); }
  friends.forEach((n) => {
    const c = document.createElement("div"); c.className = "card"; c.style.textAlign = "left"; c.innerHTML = '<b>' + n + '</b>';
    const b = document.createElement("button"); b.className = "btn-locked"; b.textContent = "Quitar"; b.style.marginTop = "6px";
    b.onclick = () => { P.removeFriend(n); renderFriends(); };
    c.appendChild(b); fl.appendChild(c);
  });
}

// ---- Online: conexión + sala ----
let netReady = false, room = null;
async function ensureConnected() {
  if (netReady) return true;
  try { await net.connect(); netReady = true; setupNetHandlers(); return true; }
  catch { toast("No hay servidor online. Corre: npm run server"); return false; }
}
function setupNetHandlers() {
  net.on("room", (m) => { room = m; showRoom(m); });
  net.on("error", (m) => toast(m.msg));
  net.on("left", (m) => game.netLeft && game.netLeft(m.id));
  net.on("state", (m) => game.netState(m.id, m.s));
  net.on("shot", (m) => game.netShot(m.id, m.x, m.y, m.ang));
  net.on("start", (m) => {
    const myTeam = m.teams[net.myId()] || "A";
    game.startOnline({ mode: m.mode, size: m.size, myId: net.myId(), team: myTeam, name: P.getSetting("username"), send: (o) => net.send(o) });
    toast("¡Partida iniciada!");
  });
  net.on("close", () => { netReady = false; toast("Conexión cerrada"); });
}
function showRoom(m) {
  $("fr-pre").style.display = "none";
  $("fr-room").style.display = "block";
  $("roomcode2").textContent = net.roomCodeNow() || m.code || "------";
  $("hostcfg").style.display = net.amHost() ? "flex" : "none";
  $("startroom").style.display = net.amHost() ? "inline-block" : "none";
  const pl = $("roomplayers"); pl.innerHTML = "";
  m.players.forEach((p) => {
    const c = document.createElement("div"); c.className = "card"; c.style.textAlign = "left";
    const host = p.id === m.hostId ? ' <span class="rar" style="color:#5DCAA5">anfitrión</span>' : "";
    const mine = p.id === net.myId() ? " (tú)" : "";
    c.innerHTML = "<b>" + p.name + mine + "</b>" + host + ' <span class="muted">· equipo ' + (p.team || "?") + "</span>";
    pl.appendChild(c);
  });
}
$("createroom").addEventListener("click", async () => {
  if (!(await ensureConnected())) return;
  net.send({ t: "create", name: P.getSetting("username"), mode: $("rmode").value, size: parseInt($("rsize").value) });
});
$("joinroom").addEventListener("click", async () => {
  const code = $("joincode").value.trim().toUpperCase();
  if (code.length !== 6) return toast("Escribe un código de 6 caracteres");
  if (!(await ensureConnected())) return;
  net.send({ t: "join", code, name: P.getSetting("username") });
});
$("rmode").addEventListener("change", () => net.amHost() && net.send({ t: "config", mode: $("rmode").value, size: parseInt($("rsize").value) }));
$("rsize").addEventListener("change", () => net.amHost() && net.send({ t: "config", mode: $("rmode").value, size: parseInt($("rsize").value) }));
$("startroom").addEventListener("click", () => net.send({ t: "start" }));
$("findmore").addEventListener("click", () => toast("Comparte el código para que entren más"));
$("leaveroom").addEventListener("click", () => { net.send({ t: "leave" }); room = null; $("fr-room").style.display = "none"; $("fr-pre").style.display = "block"; });
$("copycode").addEventListener("click", () => { const c = net.roomCodeNow(); if (c) { navigator.clipboard?.writeText(c); toast("Código copiado: " + c); } });
$("wainvite").addEventListener("click", () => {
  const c = net.roomCodeNow(); if (!c) return;
  const txt = "¡Únete a mi partida en Arena Shooter! 🎮 Código: " + c + "  " + location.origin + "/?room=" + c;
  window.open("https://wa.me/?text=" + encodeURIComponent(txt), "_blank");
});
$("findmatch").addEventListener("click", async () => {
  if (!(await ensureConnected())) return;
  $("matchstatus").textContent = "Buscando partida…";
  net.send({ t: "match", name: P.getSetting("username"), mode: $("mmode").value, size: parseInt($("msize").value) });
});

// Auto-unirse si llega por link ?room=CODE
const urlRoom = new URLSearchParams(location.search).get("room");
if (urlRoom) {
  document.querySelector('.hubb[data-sub="friends"]').click();
  ensureConnected().then((ok) => { if (ok) net.send({ t: "join", code: urlRoom.toUpperCase(), name: P.getSetting("username") }); });
}

$("unlockall").addEventListener("click", () => {
  P.unlockAll(SKINS.map((s) => s.id), DEATH_ANIMS.map((d) => d.id));
  toast("¡Todo desbloqueado! Nivel máximo. Equipa Chroma en Skins.");
  refreshUI();
});

refreshUI();
