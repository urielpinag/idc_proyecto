# syntax=docker/dockerfile:1

# Imagen de producción de la API de TV Hub (TVH-27).
# Multi-stage: dependencias -> compilación TypeScript -> runtime mínimo sin devDependencies.
# Solo se define una vez la versión base para que las tres etapas coincidan.

ARG NODE_VERSION=22-alpine

# ---------------------------------------------------------------------------
# deps: instala únicamente las dependencias del lockfile (dev incluidos, hacen
# falta para `tsc`).
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ---------------------------------------------------------------------------
# build: compila `src` a `dist` y poda las devDependencies para que el runtime
# copie un `node_modules` listo para producción.
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.json tsconfig.build.json ./
COPY src ./src

RUN npm run build \
 && npm prune --omit=dev

# ---------------------------------------------------------------------------
# production: runtime sin toolchain. Corre como el usuario `node` (no root).
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS production
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

COPY --chown=node:node package.json ./
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist

USER node

EXPOSE 3000

# `/health` es la sonda de liveness: no toca la base de datos.
# wget de BusyBox viene en la imagen alpine; falla con código != 0 si no hay 200.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider "http://127.0.0.1:${PORT}/health" || exit 1

CMD ["node", "dist/index.js"]
