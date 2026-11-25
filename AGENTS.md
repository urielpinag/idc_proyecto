# Contexto del proyecto — TV Hub (ESI3905O O2026)

Leer antes de cualquier cambio. Este archivo es la **fuente de verdad operativa** del proyecto si se
pierde la sesión o llega un agente nuevo sin la conversación previa.

## Qué es el proyecto

App **IPTV**: login, catálogo filtrable por país/categoría, reproducción **HLS** con Shaka Player,
favoritos e historial, y un admin con importación **M3U** y **re-sync sin duplicados**.

- **6 entidades**: Users, Sessions, Channels, Playlists, Favorites, WatchHistory.
- **~20 endpoints REST** + `/health` y `/ready`.
- Curso **ESI3905O O2026 — DevSecOps, ITESO**. Proyecto integrador: **33.33 %**, aprobar con **promedio ≥ 60**.

## Decisiones de plataforma (CONFIRMADAS por el profesor el 25 nov 2026)

- **GitHub** (no Azure DevOps) · **AWS** (no Azure/Cloudflare) · **EKS + DocumentDB** (no Fargate/Atlas/ECR).
- **Monorepo** `/backend` `/frontend` `/infra` · **GitHub Flow**.
- **Dev SOLO tras merge a `main`** → build + pruebas unitarias + cobertura ≥80 % → Dev automático →
  **aprobación manual** → Prod.
- **APM** = **CloudWatch + X-Ray/ADOT**. **CPU/Mem/Request** = **Container Insights + ALB + dashboard**.
- **Docker Hub** con **GitHub Secrets** + **rol IAM vía OIDC**. **Prometheus/Grafana DESCARTADO (autorizado)**.
- Terraform en `/infra`.

Justificación resumida (detalle en `docs/wiki/07-riesgos.md` y `docs/wiki/03-stack.md`):

1. **GitHub + AWS/EKS + DocumentDB**: la guía DOCX permite «AWS, Microsoft Azure u otro» y «GitHub o
   Azure DevOps»; EKS lleva a la nube el Kubernetes de clase y conserva Docker; DocumentDB es el
   equivalente gestionado de MongoDB/Mongoose de la propuesta. Nada inventado, todo explicable.
2. **CloudWatch + X-Ray/ADOT**: suite **nativa de AWS** — logs, trazas distribuidas y métricas (Container
   Insights + ALB) unificadas en dashboard; Azure Monitor/Cloudflare no aplican porque no hay recursos allí.
3. **Docker Hub + Secrets + OIDC**: equivale a la *service connection* que pide la rúbrica, sin credenciales
   estáticas (más seguro que access keys). Se mantiene Docker Hub como registry (no ECR).
4. **Sin Prometheus/Grafana**: **S13 slide 16** pide «Monitoring | Logging | APM» sin imponer herramienta; el
   profesor lo autorizó. Añadirlos duplicaría la instrumentación y no se integran nativos con AWS.

## ⭐ Simulación de trabajo de dos personas

- **Persona A = `ur` = `urielpinag`** (admin del repo). **Persona B = `Carlos Z` = `Zataaaa`** (colaborador `write`).
- Reparto: **24 `persona-a` / 24 `persona-b`** de los **48 issues `TVH-01..48`** (ya asignados en GitHub:
  24 `urielpinag` / 24 `Zataaaa` / 0 sin asignar).
- **Herramientas por identidad**: CLI **`gh` = `urielpinag`** (abre PRs de A, mergea y hace **todo el
  tablero** con `gh project`, porque el MCP no gestiona Projects v2). MCP **`github` = `Zataaaa`**
  (fine-grained PAT; abre PRs/issues/reviews de B). Dos identidades reales ya verificadas.
- **Identidades de commit (OBLIGATORIO, sin excepciones)**:
  - A → `git -c user.name=ur -c user.email=153466489+urielpinag@users.noreply.github.com`
  - B → `git -c user.name="Carlos Z" -c user.email=146884597+Zataaaa@users.noreply.github.com`
  - **NO usar `urielpinag@outlook.com`** (no asociado a la cuenta → avatar genérico; defecto heredado del
    commit raíz `e46821e`). Los commits se empujan con **un solo SSH** (`urielpinag`): GitHub atribuye por
    el **email del autor**, no por la credencial de push. Salen **"Unverified"/`unsigned`** por no estar
    firmados: es la insignia de firma, **NO afecta a la autoría ni a la rúbrica**.
- **Flujo de PRs**: cada issue se implementa en la rama de su persona; PR de A con `gh`, PR de B con el MCP;
  **aprobación SIEMPRE de la otra identidad**. `main` protegida con `required_approving_review_count=1` sin
  status checks obligatorios, `enforce_admins:false`, force-push y deletions bloqueados. Hoy hay **0 PRs**;
  los primeros llegarán con el Bloque C.
- **Tablero** (`gh project` desde `ur`): Project **#2** "IDC Proyecto Final - TV Hub" — 48 items en Backlog,
  5 Status (Backlog/Ready/In Progress/In Review/Done), 2 vistas: «View 1» TABLE y «Tablero» BOARD agrupado
  por Status vía UI. **IGNORAR el Project #1 "DBaaS-Fleet"** (preexistente, propuesta descartada).

## Estado del repo (foto al 25 nov 2026)

- `main` = **`dbe73f4`** · **4 commits** (`e46821e` root, `c0c6c28` ur, `a3a4df5` Carlos Z, `dbe73f4` ur) ·
  **13 archivos trackeados** · working tree limpio · solo `origin` SSH · repo público · **0 PRs**.
- Wiki `idc_proyecto.wiki.git`, rama `master` = **`c3cbbda`** (8 páginas, 3 Mermaid, 4 commits).
- **AUSENTE**: `/backend`, `/frontend`, `/infra`, workflows de CI, APM, métricas, URL pública → **no hay
  código todavía**. Esta foto cambia en cuanto se publique cualquier documento.

## Dónde está cada cosa

- **`docs/revision-entrega.md`** — guía de lectura principal: rúbrica, cómo se cumple, mapa de cobertura de
  30 filas, decisiones y orden del Bloque C.
- `docs/wiki/*.md` — 8 páginas (descripción, clases, stack, infra, deployment, ramas, riesgos R1–R8).
- `docs/backlog.md` · `docs/issues.md` · `docs/TV_Hub_Propuesta_Proyecto_Final.pdf` ·
  `.github/pull_request_template.md`.
- URLs: `https://github.com/urielpinag/idc_proyecto`, `.../wiki`, `.../projects`,
  `https://github.com/users/urielpinag/projects/2`.

## Pendiente para arrancar el código

- **ÚNICA validación externa**: **cuenta AWS con tope de gasto y alertas** (EKS, DocumentDB y NAT **no
  tienen free tier**, R2).
- Las 4 preguntas de **R1/R1b** ya están **respondidas y confirmadas**; **no hay decisiones de diseño
  pendientes**.
- **Diferido por decisión del usuario**: limpieza de credenciales al terminar la demo (retirar
  `GITHUB_MCP_TOKEN` de `~/.zshenv`, borrar `opencode.jsonc.bak-20261014101412`, **revocar/regenerar el
  PAT**). **NO revocar antes**: mataría el MCP de `Zataaaa` y se perdería la segunda identidad.

## Reglas operativas para cualquier agente

- No explorar de más; delegar análisis largos.
- **`git add` siempre con lista explícita** (nunca `-A` ni `.`).
- **NO commitear `.DS_Store`** ni secretos.
- **NO reescribir el historial, NO force-push, NO `pull`/`merge`/`rebase`/`reset` ni `checkout`** sin
  petición explícita.
- **NO usar herramientas destructivas** (`delete_repository`, borrados masivos).
- **NO hacer push a ningún remoto que no sea `origin`**.
- Si se edita `docs/wiki/*`, **re-publicar la Wiki** (evitar drift): clonar `.wiki.git` y adaptar enlaces a
  `[[pagina|texto]]` + URL absoluta al PDF.
- Mantener el mapa de **30 filas** de `revision-entrega.md`; **`TVH-46`** lo actualiza 🟡→✅ al implementar.
- **Fixtures M3U sintéticos propios** (NO copiar los de `tv.hub`: traen `token=`/firmas JWT de terceros, P0).
- Todo el contenido en **español**.

> Si algo no cuadra con este archivo, contrástalo con `docs/revision-entrega.md` y
> `docs/wiki/07-riesgos.md` antes de actuar.
