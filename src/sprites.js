// Cargador de sprites con respaldo: si el PNG existe en /public/sprites lo usa;
// si no, devuelve null y el juego dibuja la versión procedural.

const cache = {};

function load(path) {
  if (cache[path]) return cache[path];
  const img = new Image();
  img.src = path;
  cache[path] = img;
  return img;
}

// Devuelve la imagen SOLO si ya cargó bien; si no existe o aún carga, null.
export function getSprite(path) {
  const img = cache[path] || load(path);
  return img.complete && img.naturalWidth > 0 ? img : null;
}

// Precarga opcional (para que estén listas al primer frame).
export function preload(paths) { paths.forEach(load); }
