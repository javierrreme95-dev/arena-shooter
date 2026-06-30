// Cliente de red: conexión al servidor de salas por WebSocket.

let ws = null;
const handlers = {};
let selfId = null, roomCode = null, isHost = false;

export function connect() {
  return new Promise((res, rej) => {
    if (ws && ws.readyState === 1) return res();
    const local = ["localhost", "127.0.0.1"].includes(location.hostname);
    const url = local
      ? "ws://localhost:8787"
      : (location.protocol === "https:" ? "wss://" : "ws://") + location.host;
    ws = new WebSocket(url);
    ws.onopen = () => res();
    ws.onerror = (e) => rej(e);
    ws.onclose = () => emit("close", {});
    ws.onmessage = (ev) => {
      let m; try { m = JSON.parse(ev.data); } catch { return; }
      if (m.t === "joined") { selfId = m.you; roomCode = m.code; isHost = m.host; }
      if (m.t === "room") isHost = m.hostId === selfId;
      emit(m.t, m);
    };
  });
}

export function on(t, fn) { handlers[t] = fn; }
function emit(t, m) { if (handlers[t]) handlers[t](m); }
export function send(o) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); }
export function connected() { return !!ws && ws.readyState === 1; }
export const myId = () => selfId;
export const roomCodeNow = () => roomCode;
export const amHost = () => isHost;
