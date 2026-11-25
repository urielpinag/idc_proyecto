# TV Hub — interfaz web (`frontend/`)

Scaffold de la **UI de TV Hub**: HTML, CSS y JavaScript **vanilla**, sin build ni framework.
Incluye navegación base (login, canales, favoritos, historial), reproductor **HLS con Shaka Player**
y respaldo honesto a un stub de canales cuando el backend no responde.

> Estado: **solo scaffold (TVH-05)**. No hay login real, ni favoritos persistentes, ni historial
> registrado. Esas funcionalidades llegan con el auth JWT (`TVH-30`) y la API (`TVH-04`).

## Requisitos

- **Node.js ≥ 20** (solo para el servidor estático y los tests; la UI no compila nada).
- **Red** para cargar Shaka Player desde CDN y para los streams HLS de prueba.

## Arranque

```bash
cd frontend
npm start                 # http://127.0.0.1:8080
```

Variables de entorno del servidor estático:

| Variable       | Por defecto             | Uso                                                        |
|----------------|-------------------------|------------------------------------------------------------|
| `PORT`         | `8080`                  | Puerto del frontend.                                       |
| `HOST`         | `127.0.0.1`             | Interfaz de escucha (`0.0.0.0` dentro de un contenedor).   |
| `API_BASE_URL` | `http://localhost:3000` | Base del backend; se inyecta en el navegador vía `/config.js`. |

Con el backend en su puerto acordado:

```bash
# terminal 1 — backend (puerto 3000)
cd backend && npm start

# terminal 2 — frontend
cd frontend && API_BASE_URL=http://localhost:3000 npm start
```

Rutas del frontend: `/` (portada), `/login`, `/channels`, `/favorites`, `/history`
(también `*.html`). `GET /healthz` responde `ok` para el liveness del contenedor web.

## Configuración

`API_BASE_URL` se expone como `window.TVHUB_CONFIG.apiBaseUrl` desde `GET /config.js`, generado por
`server.mjs` a partir de la variable de entorno. Si el script no existe o llega vacío, `js/config.js`
usa `http://localhost:3000`.

## Backend y respaldo

- El indicador de la cabecera consulta `${API_BASE_URL}/health` y muestra **operativo / degradado /
  sin conexión**.
- El catálogo pide `${API_BASE_URL}/api/channels`. Si falla o devuelve una lista vacía, se usa
  `stubs/channels.json` y la UI lo marca como **Origen: Stub (datos sintéticos)** junto al motivo.
- Los canales del stub son ficticios y apuntan a **fixtures HLS públicos de tests** (mux.dev /
  unified-streaming). No hay `token=`, JWT ni credenciales, ni contenido de `tv.hub`.

## Reproductor HLS

`channels.html` carga `shaka-player.compiled.js` desde la CDN de Google, crea un `shaka.Player`
(`js/player.js`) y hace `load()` de la URL del canal elegido. Solo se aceptan URLs `http(s)://…m3u8`
sin credenciales embebidas. Si Shaka o el navegador no soportan MSE/HLS, se muestra el error en la UI.

## Tests

```bash
cd frontend
npm test                  # node --test, sin dependencias externas
```

Cubre: navegación entre las 4 páginas, configuración `API_BASE_URL`, `/health` y fallback al stub con
`fetch` simulado, validez del stub sintético, integración/inicialización de Shaka con una doble de la
librería, URLs HLS seguras y el servidor estático (assets, MIME, rutas, 404/405, `/config.js`).

### Verificación de reproducción real (manual)

```bash
cd frontend
API_BASE_URL=http://localhost:3000 PORT=8097 npm start &
node scripts/verify-hls.mjs http://127.0.0.1:8097
```

Usa la Chrome instalada (o `CHROME_PATH`) en modo *headless* para cargar `channels.html`, pulsar
«Reproducir» y comprobar que `currentTime` avanza. Requiere red y **no** corre en CI.

## Estructura

```
frontend/
├── index.html · login.html · channels.html · favorites.html · history.html
├── css/styles.css
├── js/
│   ├── config.js     API_BASE_URL
│   ├── api.js        /health, /api/channels y fallback al stub
│   ├── player.js     Shaka Player (HLS)
│   ├── ui.js         helpers DOM
│   ├── app.js        arranque común (/health, menú)
│   └── login|channels|favorites|history.js
├── stubs/channels.json
├── scripts/verify-hls.mjs
├── server.mjs        servidor estático y /config.js
└── test/             node --test
```
