// Servidor de salas para Arena Shooter (WebSocket).
// Modelo: relay por sala. Cada cliente envía su estado y el server lo reenvía
// a los demás de la sala. El "start" lo dispara el anfitrión y sincroniza a todos.
//
// Correr:  node server/index.js   (o: npm run server)
// Por defecto escucha en el puerto 8787.

import { WebSocketServer } from "ws";

const PORT = process.env.PORT || 8787;
const wss = new WebSocketServer({ port: PORT });

const rooms = new Map(); // code -> { hostId, mode, size, started, clients: Map(id->ws) }
let nextId = 1;

function code6() {
  const ch = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let c; do { c = Array.from({ length: 6 }, () => ch[Math.floor(Math.random() * ch.length)]).join(""); } while (rooms.has(c));
  return c;
}
function send(ws, obj) { if (ws.readyState === 1) ws.send(JSON.stringify(obj)); }
function broadcast(room, obj, exceptId) {
  for (const [id, ws] of room.clients) if (id !== exceptId) send(ws, obj);
}
function roomState(room) {
  return {
    t: "room",
    mode: room.mode, size: room.size, hostId: room.hostId, started: room.started,
    players: [...room.clients.values()].map((c) => ({ id: c.id, name: c.name, team: c.team || null })),
  };
}
function leaveRoom(ws) {
  const room = rooms.get(ws.room);
  if (!room) return;
  room.clients.delete(ws.id);
  broadcast(room, { t: "left", id: ws.id });
  if (room.clients.size === 0) { rooms.delete(ws.room); return; }
  if (room.hostId === ws.id) room.hostId = [...room.clients.keys()][0];
  broadcast(room, roomState(room));
  ws.room = null;
}

wss.on("connection", (ws) => {
  ws.id = nextId++;
  ws.name = "Jugador";
  ws.room = null;

  ws.on("message", (raw) => {
    let m; try { m = JSON.parse(raw); } catch { return; }

    if (m.t === "create") {
      ws.name = (m.name || "Jugador").slice(0, 20);
      const code = code6();
      rooms.set(code, { hostId: ws.id, mode: m.mode || "normal", size: m.size || 3, started: false, clients: new Map([[ws.id, ws]]) });
      ws.room = code;
      send(ws, { t: "joined", code, you: ws.id, host: true });
      send(ws, roomState(rooms.get(code)));
    }

    else if (m.t === "join") {
      const code = (m.code || "").toUpperCase();
      const room = rooms.get(code);
      if (!room) return send(ws, { t: "error", msg: "Sala no encontrada" });
      if (room.started) return send(ws, { t: "error", msg: "La partida ya empezó" });
      if (room.clients.size >= 10) return send(ws, { t: "error", msg: "Sala llena" });
      ws.name = (m.name || "Jugador").slice(0, 20);
      ws.room = code;
      room.clients.set(ws.id, ws);
      send(ws, { t: "joined", code, you: ws.id, host: false });
      broadcast(room, roomState(room));
    }

    // Matchmaking simple: busca una sala pública abierta del mismo modo/tamaño o crea una.
    else if (m.t === "match") {
      ws.name = (m.name || "Jugador").slice(0, 20);
      let found = null, code = null;
      for (const [c, r] of rooms) if (r.public && !r.started && r.mode === m.mode && r.size === m.size && r.clients.size < m.size * 2) { found = r; code = c; break; }
      if (!found) { code = code6(); found = { hostId: ws.id, mode: m.mode, size: m.size, started: false, public: true, clients: new Map() }; rooms.set(code, found); }
      found.clients.set(ws.id, ws); ws.room = code;
      send(ws, { t: "joined", code, you: ws.id, host: found.hostId === ws.id });
      broadcast(found, roomState(found));
    }

    else if (m.t === "config") {
      const room = rooms.get(ws.room);
      if (room && room.hostId === ws.id) { if (m.mode) room.mode = m.mode; if (m.size) room.size = m.size; broadcast(room, roomState(room)); }
    }

    else if (m.t === "start") {
      const room = rooms.get(ws.room);
      if (!room || room.hostId !== ws.id) return;
      room.started = true;
      const ids = [...room.clients.keys()];
      const teams = {};
      ids.forEach((id, i) => { const c = room.clients.get(id); c.team = i % 2 === 0 ? "A" : "B"; teams[id] = c.team; });
      const seed = Math.floor(Math.random() * 1e9);
      broadcast(room, { t: "start", mode: room.mode, size: room.size, seed, teams }, null);
    }

    else if (m.t === "state") {
      const room = rooms.get(ws.room);
      if (room) broadcast(room, { t: "state", id: ws.id, s: m.s }, ws.id);
    }
    else if (m.t === "shot") {
      const room = rooms.get(ws.room);
      if (room) broadcast(room, { t: "shot", id: ws.id, x: m.x, y: m.y, ang: m.ang }, ws.id);
    }
    else if (m.t === "leave") { leaveRoom(ws); }
  });

  ws.on("close", () => leaveRoom(ws));
});

console.log("Arena Shooter server en ws://localhost:" + PORT);
