# syntax=docker/dockerfile:1
FROM node:22-alpine

# El frontend no tiene dependencias ni build: sólo se copian los estáticos
# y el servidor `server.mjs` (node:http, sin npm install).
WORKDIR /app

ENV NODE_ENV=production \
    PORT=8080 \
    HOST=0.0.0.0

COPY --chown=node:node package.json server.mjs ./
COPY --chown=node:node js ./js
COPY --chown=node:node css ./css
COPY --chown=node:node stubs ./stubs
COPY --chown=node:node *.html ./

USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1

# API_BASE_URL se inyecta en el despliegue (docker run -e / EKS env).
CMD ["node", "server.mjs"]
