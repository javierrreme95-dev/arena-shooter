# Arena Shooter

Juego de arena top-down (vista superior) contra bots, hecho con Vite + Canvas (JS vanilla).

## Cómo correrlo
```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # build de producción a /dist
```

## Modos de juego
- **Normal** — duelo por equipos (2v2 a 5v5), gana el primero en llegar a la meta de kills. Aparecen potenciadores.
- **Captura la bandera** — por turnos (3 cada equipo, 90s), el atacante lleva la bandera al otro lado = 1 punto.
- **Rey de la colina** — todos contra todos; párate solo en el círculo para sumar puntos; primero a 50.
- **Infección** — 1 infectado (+50% velocidad) vs humanos; al tocarte te convierte.

## Controles
- **WASD / flechas**: mover · **Mouse**: apuntar · **Clic**: disparar · **Teclas 1/2**: arma / granada.

## Potenciadores (modo Normal)
Rapidez de disparo · Granadas · Escudo · Revivir compañero · Cegar rivales.

## Progresión
- **Skins** seleccionables (pestaña Skins) que se ven en la partida.
- **Pase de batalla** (12 niveles): ganas XP por kills, victorias y partidas; desbloqueas skins. Track free + premium.
- El progreso se guarda en `localStorage`.

## Estructura
- `src/game.js` — motor (modos, IA de bots, físicas, animaciones de eliminación, kill feed).
- `src/skins.js` — definición y dibujo de skins.
- `src/battlepass.js` — niveles del pase + render de skins y track.
- `src/progress.js` — XP, nivel, desbloqueos (persistencia).
- `src/main.js` — UI (pestañas), conexión de eventos a XP.

## Pendiente / roadmap
- Multijugador real (servidor WebSocket + salas con código) — fase grande.
- Más mapas, mira, recargas, sonido y mejor IA.
