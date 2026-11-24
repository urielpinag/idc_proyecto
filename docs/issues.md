# Issues — TV Hub

Desglose de issues por épica. Cada issue incluye **ID**, título, épica, descripción, **criterios de aceptación**, estimado, **asignado**, milestone, labels y dependencias. Los IDs de épica (`E#`) y los milestones (`M1`–`M4`) coinciden con [`backlog.md`](backlog.md).

## Paralelización y camino crítico

- **Track A (Persona A):** backend/API, Terraform/EKS y pipelines base, observabilidad de trazas + dashboard, demo y presentación.
- **Track B (Persona B):** repos/GitHub, Wiki, frontend, Docker Hub, pipelines de deploy y gate de Prod, logs/alarmas y métricas ALB.
- **Regla:** una dependencia solo es válida si es un bloqueante técnico real **dentro del mismo track**; mínimo 0 y nunca más de 1. Los cruces A↔B se sustituyen por contrato Wiki + stub (ver *Stubs para arrancar en paralelo*).
- **Dependencias que quedan** (todas intra-track y de bloqueante técnico):
  1. (Track A) TVH-39 ← TVH-37: el gate Prod del frontend reutiliza el Environment `prod` creado en el gate del backend.
  2. (Track B) TVH-43 ← TVH-21: métricas del ALB/Container Insights requieren los grupos de logs y el dashboard base.
- **Sin cadenas:** cada dependencia es de longitud 1; TVH-44 (dashboard) arranca con datos de ejemplo y no espera a TVH-43.
- **Camino crítico:** TVH-16 → TVH-17 → TVH-20 → TVH-23 → (gate Prod TVH-37/TVH-39) → TVH-45 → TVH-47; TVH-21 → TVH-43 → TVH-44 se integra en TVH-45.

## Convenciones

- **Estimado**: puntos de historia (1, 2, 3, 4 ≈ medio día a ~3 días).
- **Asignado**: Persona A / Persona B (equipo de 2). Nadie aprueba su propio PR.
- **Dependencias**: issue que debe estar `Done` antes de iniciar. Por regla de paralelización, **como máximo 1 y siempre dentro del mismo track**; `ninguna` es el caso normal.
- **Estado**: `blocked` se añade automáticamente mientras haya dependencias abiertas.
- **Arrancable en paralelo desde M1**: needs contractuales (API, imágenes, conexión a BD) se resuelven con el contrato Wiki + un stub, sin esperar a la otra persona.

## Stubs para arrancar en paralelo

- **Frontend → Backend:** contrato en [`wiki/02-componentes.md`](wiki/02-componentes.md) + ~20 endpoints REST; `frontend/stubs/channels.json` (JSON estático de canales) y mocks de `/api/*` en desarrollo.
- **Backend → DocumentDB/frontend:** `mongodb-memory-server` en pruebas; entidades ya definidas en la Wiki.
- **Imágenes Docker Hub:** nombres acordados `tvhub-api` / `tvhub-web` con tag por SHA.
- **Variables de entorno acordadas:** `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `PORT`, `API_BASE_URL`.
- **Conexión a DocumentDB acordada:** variable de Terraform `docdb_endpoint` + secreto `MONGODB_URI` con el formato del contrato (TVH-19 y TVH-29 pueden ir en paralelo).
- **Ingress/URL pública:** usar placeholder `dev.tvhub.local` hasta que TVH-20 exista.

## Mapa épica → issues

| Épica | Descripción | Issues |
|-------|-------------|--------|
| **E1** | Repositorio, monorepo y estrategia de ramas | 3 |
| **E2** | Wiki del proyecto (Markdown) | 8 |
| **E3** | Backlog en tablero (GitHub Projects) | 2 |
| **E3b** | API base (scaffold y entidades) | 7 |
| **E4** | Terraform / Repositorio de Infra | 9 |
| **E5** | Recursos creados para Backend y Frontend | 3 |
| **E6** | Pipeline Backend | 10 |
| **E7** | Pipeline Frontend | 3 |
| **E8** | Docker Hub y credenciales | 3 |
| **E9** | APM: trazas, errores y mensajes | 2 |
| **E10** | Métricas CPU / Memoria / Request | 2 |
| **E11** | Demo en vivo y reporte final | 3 |

| Épica | Issues |
|-------|--------|
| E1 | TVH-01, TVH-02, TVH-03 |
| E2 | TVH-06, TVH-07, TVH-08, TVH-09, TVH-10, TVH-11, TVH-12, TVH-13 |
| E3 | TVH-14, TVH-15 |
| E3b | TVH-04, TVH-05, TVH-29, TVH-30, TVH-31, TVH-32, TVH-33 |
| E4 | TVH-16, TVH-17, TVH-18, TVH-19, TVH-20, TVH-21, TVH-22, TVH-40, TVH-48 |
| E5 | TVH-23, TVH-24, TVH-25 |
| E6 | TVH-34, TVH-35, TVH-36, TVH-37 |
| E7 | TVH-38, TVH-39 |
| E8 | TVH-26, TVH-27, TVH-28 |
| E9 | TVH-41, TVH-42 |
| E10 | TVH-43, TVH-44 |
| E11 | TVH-45, TVH-46, TVH-47 |

### ¿Entregable de la rúbrica o soporte técnico?

- **Épicas 1:1 con la rúbrica:** E1, E2, E3, E4, E5, E6, E7, E8, E9, E10 y E11.
- **E3b es soporte técnico:** la aplicación TV Hub debe existir y funcionar sobre DocumentDB para poder
  desplegarla y monitorearla. No es un entregable de la rúbrica, pero es dependencia de E4/E5/E6/E7/E9/E10.

## Resumen

- Total de issues: **48**
- Persona A: 24 · Persona B: 24
- Por milestone: M1 = 15 · M2 = 23 · M3 = 4 · M4 = 6
- Puntos totales: 118

## Épica E1 — Repositorio, monorepo y estrategia de ramas

### TVH-01 · Crear monorepo con /backend, /frontend e /infra

- **ID:** `TVH-01`
- **Épica:** E1 — Repositorio, monorepo y estrategia de ramas
- **Milestone:** M1
- **Asignado:** Persona A
- **Estimado:** 2 pts
- **Labels:** `feature`, `platform`, `p0`
- **Dependencias:** ninguna

**Descripción:** Inicializar el repositorio único en GitHub con la estructura del monorepo y los archivos base de cada carpeta. Se ejecuta cuando el usuario autorice tocar GitHub (antes, el contenido vive solo en local).

**Criterios de aceptación:**

- [ ] Se crea el repositorio en GitHub vinculado a `git@github.com:urielpinag/idc_proyecto.git`
- [ ] Existen las carpetas `backend/`, `frontend/`, `infra/` y `docs/` con al menos su README
- [ ] El primer commit llega a `main` y el repo es visible para el equipo
- [ ] Se añade `.gitignore` y `.editorconfig`

### TVH-02 · Aplicar la estrategia de ramas y proteger main

- **ID:** `TVH-02`
- **Épica:** E1 — Repositorio, monorepo y estrategia de ramas
- **Milestone:** M1
- **Asignado:** Persona B
- **Estimado:** 2 pts
- **Labels:** `feature`, `docs`, `p0`
- **Dependencias:** ninguna

**Descripción:** Configurar `main` protegida y documentar el flujo GitHub Flow simplificado (feature/fix/infra → PR → merge).

**Criterios de aceptación:**

- [ ] `main` exige Pull Request y al menos 1 aprobación
- [ ] Checks de CI obligatorios en `main`
- [ ] Prohibido force-push y borrado de `main`
- [ ] La Wiki documenta ramas, PR y convención de commits
- [ ] Se abre un PR de prueba (feature/*) y se mergea con revisión

**Criterios añadidos (Bloque B):**

- [ ] La protección exige **PR + 1 aprobación de la otra persona** (nunca del autor)
- [ ] **No** se exigen status checks todavía (aún no hay CI configurado)
- [ ] **Cada PR lo revisa la otra persona** antes del merge

### TVH-03 · Plantilla de Pull Request y convención de commits

- **ID:** `TVH-03`
- **Épica:** E1 — Repositorio, monorepo y estrategia de ramas
- **Milestone:** M1
- **Asignado:** Persona B
- **Estimado:** 1 pt
- **Labels:** `docs`, `ci-cd`, `p1`
- **Dependencias:** ninguna

**Descripción:** Crear `.github/pull_request_template.md` con checklist (pruebas, cobertura, documentación, Dev verificado) y definir Conventional Commits.

**Criterios de aceptación:**

- [ ] La plantilla incluye checklist del autor y del revisor
- [ ] La plantilla incluye verificación del ambiente Dev
- [ ] La Wiki documenta la convención de commits
- [ ] Todos los PR posteriores usan la plantilla

## Épica E2 — Wiki del proyecto (Markdown)

### TVH-06 · Landing de la Wiki y publicación en GitHub Wiki

- **ID:** `TVH-06`
- **Épica:** E2 — Wiki del proyecto (Markdown)
- **Milestone:** M1
- **Asignado:** Persona A
- **Estimado:** 1 pt
- **Labels:** `docs`, `p1`
- **Dependencias:** ninguna

**Descripción:** Preparar la Wiki en Markdown (`docs/wiki/`) con índice y guía de publicación en la Wiki de GitHub.

**Criterios de aceptación:**

- [ ] `docs/wiki/README.md` con índice y guía de publicación
- [ ] Se documenta el repo aparte `<repo>.wiki.git`
- [ ] La Wiki está lista para subirse cuando el usuario lo autorice

### TVH-07 · Wiki: descripción, problema, alcance y distribución de actividades

- **ID:** `TVH-07`
- **Épica:** E2 — Wiki del proyecto (Markdown)
- **Milestone:** M1
- **Asignado:** Persona B
- **Estimado:** 2 pts
- **Labels:** `docs`, `p1`
- **Dependencias:** ninguna

**Descripción:** Redactar la descripción del proyecto, el problema, el alcance, los usuarios y el reparto de actividades del equipo.

**Criterios de aceptación:**

- [ ] Se describe el problema y la solución TV Hub
- [ ] Se listan usuarios y alcance (dentro/fuera)
- [ ] Se documenta la distribución de actividades de 2 personas
- [ ] Cumple el reporte de la guía (descripción y actividades)

### TVH-08 · Wiki: componentes y diagrama de clases en Mermaid

- **ID:** `TVH-08`
- **Épica:** E2 — Wiki del proyecto (Markdown)
- **Milestone:** M1
- **Asignado:** Persona A
- **Estimado:** 2 pts
- **Labels:** `docs`, `p1`
- **Dependencias:** ninguna

**Descripción:** Documentar las 6 entidades, sus métodos y el diagrama de clases en Mermaid.

**Criterios de aceptación:**

- [ ] Se documentan Users, Sessions, Channels, Playlists, Favorites y WatchHistory
- [ ] Se incluyen los métodos clave (importPlaylist, syncPlaylist, refresh, logoutAll, recordView, getTopChannels)
- [ ] Existe un bloque `classDiagram` válido en Mermaid
- [ ] Se listan los ~20 endpoints REST

### TVH-09 · Wiki: stack tecnológico y justificación AWS/EKS/DocumentDB

- **ID:** `TVH-09`
- **Épica:** E2 — Wiki del proyecto (Markdown)
- **Milestone:** M1
- **Asignado:** Persona B
- **Estimado:** 2 pts
- **Labels:** `docs`, `p1`
- **Dependencias:** ninguna

**Descripción:** Documentar el stack y las 6 decisiones cerradas (GitHub, monorepo, AWS, EKS, DocumentDB, Docker Hub) con su justificación.

**Criterios de aceptación:**

- [ ] Se justifica GitHub frente a Azure DevOps
- [ ] Se justifica EKS frente a ECS y DocumentDB frente a MongoDB en StatefulSet
- [ ] Se documenta la compatibilidad DocumentDB ↔ Mongoose
- [ ] Se listan las restricciones del curso sobre IA

### TVH-10 · Wiki: infraestructura y diagrama de infraestructura en Mermaid

- **ID:** `TVH-10`
- **Épica:** E2 — Wiki del proyecto (Markdown)
- **Milestone:** M1
- **Asignado:** Persona A
- **Estimado:** 2 pts
- **Labels:** `docs`, `p1`
- **Dependencias:** ninguna

**Descripción:** Enumerar los recursos AWS a crear y diagramar la infraestructura con Mermaid.

**Criterios de aceptación:**

- [ ] Se enumeran VPC, subnets, EKS, node group, IAM/OIDC, ALB controller, DocumentDB, SGs y CloudWatch
- [ ] Existe un bloque `flowchart` válido en Mermaid
- [ ] Se separan ambientes Dev y Prod

### TVH-11 · Wiki: deployment/CI-CD y diagrama de deployment en Mermaid

- **ID:** `TVH-11`
- **Épica:** E2 — Wiki del proyecto (Markdown)
- **Milestone:** M1
- **Asignado:** Persona B
- **Estimado:** 2 pts
- **Labels:** `docs`, `p1`
- **Dependencias:** ninguna

**Descripción:** Documentar el pipeline y diagramar el flujo de deployment con Mermaid.

**Criterios de aceptación:**

- [ ] Se documenta push/PR → Actions → Dev → aprobación → Prod → URL pública
- [ ] Existe un bloque `flowchart` válido en Mermaid
- [ ] Se describe la autenticación OIDC y los artefactos (lcov/JUnit)

### TVH-12 · Wiki: estrategia de ramas y nota comparativa con GitFlow

- **ID:** `TVH-12`
- **Épica:** E2 — Wiki del proyecto (Markdown)
- **Milestone:** M1
- **Asignado:** Persona A
- **Estimado:** 1 pt
- **Labels:** `docs`, `p1`
- **Dependencias:** ninguna

**Descripción:** Documentar ramas, protección de `main`, revisión y la comparación breve con el GitFlow de TV Hub.

**Criterios de aceptación:**

- [ ] Se documentan `main`, `feature/*`, `fix/*`, `infra/*`
- [ ] Se explica la protección de `main` y la revisión obligatoria
- [ ] Incluye nota breve comparativa con GitFlow y por qué se simplificó

### TVH-13 · Wiki: sección de riesgos y pendientes de confirmar

- **ID:** `TVH-13`
- **Épica:** E2 — Wiki del proyecto (Markdown)
- **Milestone:** M1
- **Asignado:** Persona B
- **Estimado:** 1 pt
- **Labels:** `docs`, `p1`
- **Dependencias:** ninguna

**Descripción:** Documentar los riesgos y pendientes: Azure/CloudFlare vs CloudWatch, costo EKS/DocumentDB, compatibilidad, APM/Terraform autodidactas y dependencia de M3U.

**Criterios de aceptación:**

- [ ] Se documenta el pendiente de confirmar CloudWatch con el profesor
- [ ] Se documenta el costo real de EKS y DocumentDB
- [ ] Se documenta la compatibilidad DocumentDB ↔ Mongoose 8
- [ ] Se documentan APM/Terraform autodidactas y la dependencia de M3U

## Épica E3 — Backlog en tablero (GitHub Projects)

### TVH-14 · Crear el tablero de GitHub Projects con columnas y labels

- **ID:** `TVH-14`
- **Épica:** E3 — Backlog en tablero (GitHub Projects)
- **Milestone:** M1
- **Asignado:** Persona A
- **Estimado:** 2 pts
- **Labels:** `feature`, `docs`, `p0`
- **Dependencias:** ninguna

**Descripción:** Crear el proyecto Board con columnas Backlog / Ready / In Progress / In Review / Done y los labels definidos.

**Criterios de aceptación:**

- [ ] Existen las 5 columnas del board
- [ ] Están creados los labels de tipo, área y prioridad
- [ ] Los issues importados se ven en el board
- [ ] El tablero es visible para el equipo

### TVH-15 · Crear milestones y cargar los issues del backlog

- **ID:** `TVH-15`
- **Épica:** E3 — Backlog en tablero (GitHub Projects)
- **Milestone:** M1
- **Asignado:** Persona B
- **Estimado:** 3 pts
- **Labels:** `docs`, `p0`
- **Dependencias:** ninguna

**Descripción:** Crear los milestones M1–M4 y cargar todos los issues de este documento con sus labels, milestone y asignación.

**Criterios de aceptación:**

- [ ] Existen los milestones M1, M2, M3 y M4
- [ ] Están creados todos los issues con su ID
- [ ] Cada issue tiene milestone, labels y asignado
- [ ] El board refleja el backlog completo

## Épica E3b — API base (scaffold y entidades)

### TVH-04 · Scaffold backend: TypeScript + Express 5 + /health y /ready

- **ID:** `TVH-04`
- **Épica:** E3b — API base (scaffold y entidades)
- **Milestone:** M1
- **Asignado:** Persona A
- **Estimado:** 3 pts
- **Labels:** `feature`, `backend`, `p0`
- **Dependencias:** ninguna

**Descripción:** Inicializar `/backend` con TypeScript strict, Node 22, Express 5, lints y endpoints `/health` y `/ready`.

**Criterios de aceptación:**

- [ ] Compila con `tsc --strict`
- [ ] `GET /health` responde 200
- [ ] `GET /ready` valida la conexión a la BD
- [ ] Estructura MVC (modelo/controlador/rutas) en `/backend
- [ ] Scripts `build`, `start` y `test` funcionando

### TVH-05 · Scaffold frontend: HTML/CSS/JS vanilla + Shaka Player

- **ID:** `TVH-05`
- **Épica:** E3b — API base (scaffold y entidades)
- **Milestone:** M1
- **Asignado:** Persona B
- **Estimado:** 3 pts
- **Labels:** `feature`, `frontend`, `p1`
- **Dependencias:** ninguna

**Descripción:** Inicializar `/frontend` con las páginas base (login, canales, favoritos, historial) y Shaka Player para HLS.

**Arrancable en paralelo desde M1:** consume el contrato de [`wiki/02-componentes.md`](wiki/02-componentes.md) y el stub `frontend/stubs/channels.json` (JSON estático de canales); los mocks de `/api/*` sustituyen al backend hasta que exista. Variables acordadas: `API_BASE_URL`.

**Criterios de aceptación:**

- [ ] Páginas base navegables
- [ ] Shaka Player integrado y reproduce un stream HLS de prueba
- [ ] El frontend consume `/health` del backend
- [ ] Sin build pesado: assets estáticos servidos

### TVH-29 · Configurar entidades y modelos con Mongoose para DocumentDB

- **ID:** `TVH-29`
- **Épica:** E3b — API base (scaffold y entidades)
- **Milestone:** M2
- **Asignado:** Persona A
- **Estimado:** 4 pts
- **Labels:** `feature`, `backend`, `p0`
- **Dependencias:** ninguna

**Descripción:** Implementar los 6 modelos (Users, Sessions, Channels, Playlists, Favorites, WatchHistory) compatibles con DocumentDB.

**Arrancable en paralelo desde M1:** define los modelos desde el contrato de la Wiki y prueba con `mongodb-memory-server`, sin esperar al cluster DocumentDB de TVH-19.

**Criterios de aceptación:**

- [ ] Existen los 6 modelos con índices
- [ ] Se validó la conexión CRUD contra DocumentDB en Dev
- [ ] Se evitan operadores fuera de MongoDB ~4.0
- [ ] La cobertura de los modelos está incluida

### TVH-30 · Implementar auth JWT con refresh rotativo y bcrypt

- **ID:** `TVH-30`
- **Épica:** E3b — API base (scaffold y entidades)
- **Milestone:** M2
- **Asignado:** Persona B
- **Estimado:** 4 pts
- **Labels:** `feature`, `backend`, `p0`
- **Dependencias:** ninguna

**Descripción:** Implementar `/api/auth` con registro, login, refresh rotativo en cookie HttpOnly, logout y logout-all.

**Criterios de aceptación:**

- [ ] Registro y login funcionan con bcrypt + JWT
- [ ] El refresh rota el token e invalida el anterior
- [ ] `logout-all` revoca todas las sesiones
- [ ] Los tests de auth cubren éxito y errores

### TVH-31 · CRUD de channels y búsqueda por nombre/país/categoría

- **ID:** `TVH-31`
- **Épica:** E3b — API base (scaffold y entidades)
- **Milestone:** M2
- **Asignado:** Persona A
- **Estimado:** 3 pts
- **Labels:** `feature`, `backend`, `p1`
- **Dependencias:** ninguna

**Descripción:** Implementar `/api/channels` con listado filtrado y CRUD administrativo.

**Criterios de aceptación:**

- [ ] Listado con filtros por nombre, país y categoría
- [ ] CRUD solo para admin
- [ ] Los tests cubren filtros y errores

### TVH-32 · Importación y sincronización de listas M3U sin duplicados

- **ID:** `TVH-32`
- **Épica:** E3b — API base (scaffold y entidades)
- **Milestone:** M2
- **Asignado:** Persona B
- **Estimado:** 3 pts
- **Labels:** `feature`, `backend`, `p1`
- **Dependencias:** ninguna

**Descripción:** Implementar `/api/playlists` con `importPlaylist` y `syncPlaylist` sin duplicar canales.

**Criterios de aceptación:**

- [ ] `importPlaylist` parsea una M3U y crea canales
- [ ] `syncPlaylist` hace upsert sin duplicados
- [ ] `/api/playlists/sync` está expuesto
- [ ] Los tests cubren import + re-sync

### TVH-33 · CRUD de usuarios, favoritos e historial

- **ID:** `TVH-33`
- **Épica:** E3b — API base (scaffold y entidades)
- **Milestone:** M2
- **Asignado:** Persona A
- **Estimado:** 3 pts
- **Labels:** `feature`, `backend`, `p1`
- **Dependencias:** ninguna

**Descripción:** Implementar `/api/users`, `/api/favorites` y `/api/history` (incluye `/top`).

**Criterios de aceptación:**

- [ ] CRUD de usuarios solo admin
- [ ] Favoritos por usuario sin duplicados
- [ ] Historial con `record` y `top`
- [ ] Los tests cubren cada endpoint

## Épica E4 — Terraform / Repositorio de Infra

### TVH-16 · Terraform: backend remoto, VPC y subnets

- **ID:** `TVH-16`
- **Épica:** E4 — Terraform / Repositorio de Infra
- **Milestone:** M2
- **Asignado:** Persona A
- **Estimado:** 3 pts
- **Labels:** `infra`, `platform`, `p0`
- **Dependencias:** ninguna

**Descripción:** Configurar Terraform en `/infra` con backend remoto y crear la VPC, subnets públicas/privadas, IGW, NAT y route tables.

**Criterios de aceptación:**

- [ ] `terraform init` y `terraform validate` pasan
- [ ] Existen VPC, 2+ subnets públicas y 2+ privadas en 2+ AZ
- [ ] La salida expone IDs de VPC y subnets al resto de módulos
- [ ] `terraform fmt -check` en verde

### TVH-17 · Terraform: cluster EKS y node group gestionado

- **ID:** `TVH-17`
- **Épica:** E4 — Terraform / Repositorio de Infra
- **Milestone:** M2
- **Asignado:** Persona A
- **Estimado:** 4 pts
- **Labels:** `infra`, `platform`, `p0`
- **Dependencias:** ninguna

**Descripción:** Provisionar el cluster EKS en subnets privadas con un node group gestionado y los addons base.

**Criterios de aceptación:**

- [ ] El cluster EKS existe y `kubectl` responde
- [ ] Node group con `min/desired/max` configurable
- [ ] Addons `kube-proxy`, `coredns`, `vpc-cni` y `aws-ebs-csi-driver` activos
- [ ] `metrics-server` instalado

### TVH-18 · Terraform: IAM, OIDC provider y roles

- **ID:** `TVH-18`
- **Épica:** E4 — Terraform / Repositorio de Infra
- **Milestone:** M2
- **Asignado:** Persona B
- **Estimado:** 3 pts
- **Labels:** `infra`, `platform`, `p0`
- **Dependencias:** ninguna

**Descripción:** Crear roles IAM del cluster y de los nodos, el OIDC provider y el rol de despliegue asumible por GitHub Actions.

**Criterios de aceptación:**

- [ ] Existe el OIDC provider del cluster
- [ ] El rol de despliegue confía en GitHub Actions para `dev` y `prod`
- [ ] El rol tiene permisos mínimos sobre EKS
- [ ] Los ARNs se guardan en GitHub Secrets

### TVH-19 · Terraform: DocumentDB cluster y Security Groups

- **ID:** `TVH-19`
- **Épica:** E4 — Terraform / Repositorio de Infra
- **Milestone:** M2
- **Asignado:** Persona B
- **Estimado:** 3 pts
- **Labels:** `infra`, `platform`, `p0`
- **Dependencias:** ninguna

**Descripción:** Crear el cluster DocumentDB en subnets privadas con un Security Group que solo acepte tráfico desde EKS.

**Criterios de aceptación:**

- [ ] Existe el cluster DocumentDB con instancia primaria
- [ ] Subnet group en subnets privadas
- [ ] El SG de DocumentDB solo permite el puerto 27017 desde los nodos
- [ ] Las credenciales no están en el repositorio

### TVH-20 · Terraform: AWS Load Balancer Controller e Ingress/ALB público

- **ID:** `TVH-20`
- **Épica:** E4 — Terraform / Repositorio de Infra
- **Milestone:** M2
- **Asignado:** Persona A
- **Estimado:** 4 pts
- **Labels:** `infra`, `platform`, `p0`
- **Dependencias:** ninguna

**Descripción:** Instalar el ALB controller con IRSA y exponer los services vía Ingress NGINX creando un ALB con URL pública.

**Criterios de aceptación:**

- [ ] El ALB controller corre en el cluster
- [ ] Ingress NGINX crea un ALB accesible por HTTPS
- [ ] Existe una URL pública por ambiente
- [ ] Las reglas de seguridad permiten el tráfico ALB ↔ nodos

### TVH-21 · Terraform: CloudWatch Logs y dashboard base

- **ID:** `TVH-21`
- **Épica:** E4 — Terraform / Repositorio de Infra
- **Milestone:** M2
- **Asignado:** Persona B
- **Estimado:** 2 pts
- **Labels:** `infra`, `observability`, `p1`
- **Dependencias:** ninguna

**Descripción:** Crear grupos de logs por ambiente y un dashboard de CloudWatch como base de observabilidad.

**Criterios de aceptación:**

- [ ] Existen grupos de logs por ambiente y servicio
- [ ] Los pods envían logs a CloudWatch Logs
- [ ] El dashboard base existe y muestra CPU/memoria
- [ ] El dashboard es accesible para el equipo

### TVH-22 · Terraform: IaC del repositorio y documentación de `terraform plan`

- **ID:** `TVH-22`
- **Épica:** E4 — Terraform / Repositorio de Infra
- **Milestone:** M2
- **Asignado:** Persona A
- **Estimado:** 2 pts
- **Labels:** `infra`, `platform`, `p1`
- **Dependencias:** ninguna — arrancable en paralelo desde M1 (contrato IaC de la Wiki + stub: `terraform plan` contra el módulo DocumentDB acordado, sin esperar al cluster real).

**Descripción:** Completar el módulo de infraestructura: módulos por recurso, outputs y revisión de `terraform plan` en PR.

**Criterios de aceptación:**

- [ ] `terraform plan` se ejecuta en PR y es revisado
- [ ] El código está organizado en módulos por recurso
- [ ] Se documenta cómo ejecutar `apply`/`destroy`
- [ ] No hay secretos en el repositorio

### TVH-40 · Workflow de Infraestructura: `terraform plan/apply`

- **ID:** `TVH-40`
- **Épica:** E4 — Terraform / Repositorio de Infra
- **Milestone:** M2
- **Asignado:** Persona B
- **Estimado:** 3 pts
- **Labels:** `ci-cd`, `infra`, `p1`
- **Dependencias:** ninguna

**Descripción:** Crear el workflow de Terraform con `fmt -check`, `validate`, `plan` en PR y `apply` en `main` con aprobación.

**Criterios de aceptación:**

- [ ] `terraform fmt -check` y `validate` en PR
- [ ] `plan` se publica como artefacto o comentario en el PR
- [ ] `apply` requiere aprobación en `main`
- [ ] El workflow usa OIDC, sin claves estáticas

### TVH-48 · Plan de recorte/apagado de costos EKS y DocumentDB

- **ID:** `TVH-48`
- **Épica:** E4 — Terraform / Repositorio de Infra
- **Milestone:** M4
- **Asignado:** Persona B
- **Estimado:** 1 pt
- **Labels:** `infra`, `platform`, `p1`
- **Dependencias:** ninguna

**Descripción:** Definir y documentar cómo apagar o recortar recursos (nodos, DocumentDB) fuera de la demo.

**Criterios de aceptación:**

- [ ] Se documenta `terraform destroy`/scale-down
- [ ] Se documenta el costo estimado por hora
- [ ] Se define una ventana de apagado fuera de la demo
- [ ] Se revisa antes de la presentación

## Épica E5 — Recursos creados para Backend y Frontend

### TVH-23 · Desplegar backend en EKS (Deployment + Service + Secrets)

- **ID:** `TVH-23`
- **Épica:** E5 — Recursos creados para Backend y Frontend
- **Milestone:** M2
- **Asignado:** Persona A
- **Estimado:** 3 pts
- **Labels:** `infra`, `backend`, `p0`
- **Dependencias:** ninguna

**Descripción:** Desplegar el backend en el namespace `dev` con Deployment, Service, probes, Secrets e imagePullSecrets.

**Arrancable en paralelo desde M1:** despliega con el nombre de imagen acordado `tvhub-api` (tag por SHA) y las variables acordadas (`MONGODB_URI`, `JWT_SECRET`, `API_BASE_URL`); si el ALB no existe aún, usar el placeholder `dev.tvhub.local`.

**Criterios de aceptación:**

- [ ] El Deployment `tvhub-api` corre en `dev` con 2 réplicas
- [ ] El Service expone el backend al Ingress
- [ ] La cadena de conexión y `JWT_SECRET` vienen de Secrets
- [ ] `/health` y `/ready` responden vía la URL pública

### TVH-24 · Desplegar frontend en EKS (Deployment + Service)

- **ID:** `TVH-24`
- **Épica:** E5 — Recursos creados para Backend y Frontend
- **Milestone:** M2
- **Asignado:** Persona B
- **Estimado:** 2 pts
- **Labels:** `infra`, `frontend`, `p0`
- **Dependencias:** ninguna

**Descripción:** Desplegar el frontend en el namespace `dev` detrás del Ingress, consumiendo la API del backend.

**Arrancable en paralelo desde M1:** despliega con el nombre de imagen acordado `tvhub-web` (tag por SHA); el frontend usa `API_BASE_URL` y el stub `frontend/stubs/channels.json` mientras el backend no esté desplegado.

**Criterios de aceptación:**

- [ ] El Deployment `tvhub-web` corre en `dev`
- [ ] El Ingress enruta el frontend en la raíz
- [ ] El frontend consume el backend por la URL pública
- [ ] Se documenta la alternativa S3 + CloudFront

### TVH-25 · Implementar HPA 2→5 y verificar escalado

- **ID:** `TVH-25`
- **Épica:** E5 — Recursos creados para Backend y Frontend
- **Milestone:** M2
- **Asignado:** Persona A
- **Estimado:** 2 pts
- **Labels:** `infra`, `observability`, `p1`
- **Dependencias:** ninguna

**Descripción:** Configurar el HPA del backend con CPU > 70% y verificar el escalado con carga.

**Criterios de aceptación:**

- [ ] Existe el HPA de `tvhub-api` de 2 a 5 réplicas
- [ ] El HPA usa `metrics-server`
- [ ] Se verifica el escalado con una carga de prueba
- [ ] Se documenta el resultado en la Wiki

## Épica E6 — Pipeline Backend

### TVH-34 · Suite de pruebas y cobertura mínima 80%

- **ID:** `TVH-34`
- **Épica:** E6 — Pipeline Backend
- **Milestone:** M2
- **Asignado:** Persona B
- **Estimado:** 4 pts
- **Labels:** `testing`, `backend`, `p0`
- **Dependencias:** ninguna

**Descripción:** Completar la suite de Jest + Supertest con `mongodb-memory-server` y una cobertura mínima bloqueante del 80%.

**Arrancable en paralelo desde M1:** la suite usa `mongodb-memory-server` y el contrato de endpoints de [`wiki/02-componentes.md`](wiki/02-componentes.md); no requiere auth ni CRUD terminados.

**Criterios de aceptación:**

- [ ] La suite cubre todos los endpoints críticos
- [ ] La cobertura es ≥ 80% y bloquea el pipeline
- [ ] Se publican `lcov` y JUnit
- [ ] Se ejecutan en cada push y PR

### TVH-35 · Workflow de Backend: build + pruebas unitarias + cobertura

- **ID:** `TVH-35`
- **Épica:** E6 — Pipeline Backend
- **Milestone:** M2
- **Asignado:** Persona A
- **Estimado:** 3 pts
- **Labels:** `ci-cd`, `backend`, `p0`
- **Dependencias:** ninguna

**Descripción:** Crear el workflow de GitHub Actions del backend con build, pruebas y cobertura bloqueante, con filtro por ruta.

**Arrancable en paralelo desde M1:** el workflow corre con el scaffold de pruebas y la imagen `tvhub-api` acordada; no espera a Docker Hub ni a las pruebas completas.

**Criterios de aceptación:**

- [ ] El workflow corre en push y PR sobre `/backend`
- [ ] La cobertura < 80% falla el job
- [ ] Sube artefactos `lcov` y JUnit
- [ ] El job es un check obligatorio en `main`

### TVH-36 · Workflow de Backend: build de imagen y deploy a Dev

- **ID:** `TVH-36`
- **Épica:** E6 — Pipeline Backend
- **Milestone:** M2
- **Asignado:** Persona B
- **Estimado:** 3 pts
- **Labels:** `ci-cd`, `backend`, `p0`
- **Dependencias:** ninguna

**Descripción:** Añadir al workflow del backend el build de imagen y el despliegue al ambiente Dev tras las pruebas.

**Arrancable en paralelo desde M1:** publica en `tvhub-api` (tag por SHA) y aplica al namespace `dev` de forma idempotente; el manifiesto puede asumir las variables acordadas.

**Criterios de aceptación:**

- [ ] La imagen se publica en Docker Hub con tag por SHA
- [ ] `kubectl apply` despliega en el namespace `dev`
- [ ] El ambiente Dev presenta la nueva versión
- [ ] Se verifica la URL pública de Dev

### TVH-37 · Workflow de Backend: gate de Prod con required reviewers

- **ID:** `TVH-37`
- **Épica:** E6 — Pipeline Backend
- **Milestone:** M4
- **Asignado:** Persona A
- **Estimado:** 2 pts
- **Labels:** `ci-cd`, `backend`, `p0`
- **Dependencias:** ninguna

**Descripción:** Configurar el GitHub Environment `prod` con required reviewers y el job de despliegue a Prod.

**Criterios de aceptación:**

- [ ] El Environment `prod` tiene required reviewers
- [ ] El job de Prod se bloquea hasta la aprobación
- [ ] Tras la aprobación se despliega en el namespace `prod`
- [ ] Se verifica la URL pública de Prod

## Épica E7 — Pipeline Frontend

### TVH-38 · Workflow del Frontend: build y deploy a Dev

- **ID:** `TVH-38`
- **Épica:** E7 — Pipeline Frontend
- **Milestone:** M2
- **Asignado:** Persona B
- **Estimado:** 2 pts
- **Labels:** `ci-cd`, `frontend`, `p0`
- **Dependencias:** ninguna

**Descripción:** Crear el workflow del frontend con filtro por ruta: build, imagen, Docker Hub y deploy a Dev.

**Arrancable en paralelo desde M1:** publica en `tvhub-web` (tag por SHA) y despliega en `dev`; el manifiesto usa el placeholder de URL y el stub de canales.

**Criterios de aceptación:**

- [ ] El workflow corre sobre `/frontend`
- [ ] La imagen se publica en Docker Hub
- [ ] El frontend se despliega en `dev`
- [ ] La URL de Dev sirve la app correctamente

### TVH-39 · Workflow del Frontend: gate de Prod con required reviewers

- **ID:** `TVH-39`
- **Épica:** E7 — Pipeline Frontend
- **Milestone:** M4
- **Asignado:** Persona A
- **Estimado:** 1 pt
- **Labels:** `ci-cd`, `frontend`, `p1`, `blocked`
- **Dependencias:** `TVH-37` — bloqueante técnico: el frontend reutiliza el Environment `prod` y el gate de aprobación ya creados.

**Descripción:** Añadir el gate de aprobación a Prod para el frontend, igual que en el backend.

**Criterios de aceptación:**

- [ ] El job de Prod requiere aprobación
- [ ] Tras la aprobación se despliega en `prod`
- [ ] La URL de Prod sirve la nueva versión

## Épica E8 — Docker Hub y credenciales

### TVH-26 · Configurar Docker Hub y credenciales (service connection equivalente)

- **ID:** `TVH-26`
- **Épica:** E8 — Docker Hub y credenciales
- **Milestone:** M2
- **Asignado:** Persona B
- **Estimado:** 2 pts
- **Labels:** `infra`, `ci-cd`, `p0`
- **Dependencias:** ninguna

**Descripción:** Configurar el usuario de Docker Hub, los repositorios de imágenes y las credenciales en GitHub Secrets.

**Criterios de aceptación:**

- [ ] Existen los repositorios `tvhub-api` y `tvhub-web` en Docker Hub
- [ ] Las credenciales están en GitHub Secrets
- [ ] Existe `imagePullSecret` para EKS
- [ ] Ninguna credencial está en el código

### TVH-27 · Dockerfile multi-stage del backend

- **ID:** `TVH-27`
- **Épica:** E8 — Docker Hub y credenciales
- **Milestone:** M2
- **Asignado:** Persona A
- **Estimado:** 2 pts
- **Labels:** `infra`, `backend`, `p0`
- **Dependencias:** ninguna

**Descripción:** Crear el Dockerfile multi-stage del backend y publicar la imagen de prueba en Docker Hub.

**Criterios de aceptación:**

- [ ] La imagen compila y arranca con usuario no root
- [ ] El tamaño de la imagen se reduce con multi-stage
- [ ] La imagen se publica en Docker Hub con tag por SHA
- [ ] El contenedor expone `/health` correctamente

### TVH-28 · Dockerfile multi-stage del frontend

- **ID:** `TVH-28`
- **Épica:** E8 — Docker Hub y credenciales
- **Milestone:** M2
- **Asignado:** Persona B
- **Estimado:** 1 pt
- **Labels:** `infra`, `frontend`, `p1`
- **Dependencias:** ninguna

**Descripción:** Crear el Dockerfile del frontend (servidor estático) y publicar la imagen en Docker Hub.

**Criterios de aceptación:**

- [ ] La imagen sirve el frontend correctamente
- [ ] La imagen se publica en Docker Hub con tag por SHA
- [ ] Se documenta cómo actualizar la imagen

## Épica E9 — APM: trazas, errores y mensajes

### TVH-41 · APM: instrumentar backend con AWS X-Ray / ADOT (OpenTelemetry)

- **ID:** `TVH-41`
- **Épica:** E9 — APM: trazas, errores y mensajes
- **Milestone:** M3
- **Asignado:** Persona A
- **Estimado:** 4 pts
- **Labels:** `observability`, `backend`, `p1`
- **Dependencias:** ninguna

**Descripción:** Instrumentar la API con OpenTelemetry/ADOT para enviar trazas a AWS X-Ray y correlacionar errores.

**Arrancable en paralelo desde M1:** la instrumentación se desarrolla contra el scaffold y el deployment local; las trazas se validan cuando exista el backend en EKS.

**Criterios de aceptación:**

- [ ] Las peticiones producen trazas en X-Ray
- [ ] Se incluyen los errores y mensajes en las trazas
- [ ] Se documentan los IDs de traza en la Wiki
- [ ] La instrumentación no degrada `/health`

### TVH-42 · APM: logs estructurados y alarmas de error en CloudWatch

- **ID:** `TVH-42`
- **Épica:** E9 — APM: trazas, errores y mensajes
- **Milestone:** M3
- **Asignado:** Persona B
- **Estimado:** 3 pts
- **Labels:** `observability`, `backend`, `p1`
- **Dependencias:** ninguna

**Descripción:** Añadir logs estructurados y alarmas de error (5xx) en CloudWatch, con una vista de errores.

**Criterios de aceptación:**

- [ ] Los logs tienen estructura (json) y nivel
- [ ] Existe una alarma para errores 5xx
- [ ] Los errores se localizan por traza en CloudWatch
- [ ] Se documenta en la Wiki

## Épica E10 — Métricas CPU / Memoria / Request

### TVH-43 · Métricas: Container Insights y métricas del ALB

- **ID:** `TVH-43`
- **Épica:** E10 — Métricas CPU / Memoria / Request
- **Milestone:** M3
- **Asignado:** Persona B
- **Estimado:** 3 pts
- **Labels:** `observability`, `platform`, `p1`, `blocked`
- **Dependencias:** `TVH-21` — bloqueante técnico: las métricas requieren los grupos de logs y el dashboard base.

**Descripción:** Habilitar Container Insights y recolectar métricas del ALB (requests, latencia, 4xx/5xx).

**Criterios de aceptación:**

- [ ] Container Insights reporta CPU y memoria por pod/nodo
- [ ] El ALB expone métricas de requests
- [ ] Las métricas se ven en CloudWatch
- [ ] Se documenta el nombre de los dashboards

### TVH-44 · Dashboard de CPU / memoria / requests

- **ID:** `TVH-44`
- **Épica:** E10 — Métricas CPU / Memoria / Request
- **Milestone:** M3
- **Asignado:** Persona A
- **Estimado:** 2 pts
- **Labels:** `observability`, `platform`, `p1`
- **Dependencias:** ninguna — arrancable en paralelo desde M1 (contrato Wiki + stub: dashboard JSON con métricas de ejemplo hasta que TVH-43 recolecte las reales).

**Descripción:** Construir el dashboard de CloudWatch con CPU, memoria y requests para Dev y Prod.

**Criterios de aceptación:**

- [ ] El dashboard muestra CPU y memoria por servicio
- [ ] El dashboard muestra requests y latencia del ALB
- [ ] Hay una vista por ambiente
- [ ] Se documenta cómo interpretarlo en la Wiki

## Épica E11 — Demo en vivo y reporte final

### TVH-45 · Ensayo de demo: cambio → PR → Dev → aprobación → Prod

- **ID:** `TVH-45`
- **Épica:** E11 — Demo en vivo y reporte final
- **Milestone:** M4
- **Asignado:** Persona A
- **Estimado:** 3 pts
- **Labels:** `testing`, `ci-cd`, `p0`
- **Dependencias:** ninguna

**Descripción:** Ensayo completo del flujo de la rúbrica con un cambio real, midiendo tiempos y resultados.

**Criterios de aceptación:**

- [ ] Se hace un cambio en código y se abre el PR
- [ ] Se autoriza el PR y el pipeline corre en Dev
- [ ] Se ven las pruebas unitarias y el proyecto en Dev
- [ ] Se aprueba a Prod y se ve el cambio en la URL pública

**Criterios añadidos (Bloque B):**

- [ ] Hay **capturas o grabación de respaldo** del resultado de las pruebas unitarias
- [ ] Hay **capturas de respaldo** del proyecto publicado en Dev, de la aprobación a Prod y del cambio visible en la **URL pública**
- [ ] El ensayo **usa el mapa de cobertura actualizado** de la rúbrica

### TVH-46 · Redactar el reporte final y la distribución de actividades

- **ID:** `TVH-46`
- **Épica:** E11 — Demo en vivo y reporte final
- **Milestone:** M4
- **Asignado:** Persona B
- **Estimado:** 3 pts
- **Labels:** `docs`, `p0`
- **Dependencias:** ninguna

**Descripción:** Redactar el reporte con descripción, diseño y explicación de la arquitectura, distribución de actividades, conclusiones y mejoras pendientes.

**Criterios de aceptación:**

- [ ] El reporte incluye descripción y arquitectura
- [ ] Incluye distribución de actividades
- [ ] Incluye conclusiones y mejoras pendientes
- [ ] Referencia la Wiki y los diagramas Mermaid

**Criterios añadidos (Bloque B):**

- [ ] El reporte incluye **el mapa de cobertura de la rúbrica con el paso 🟡→✅** de cada punto implementado
- [ ] El reporte incluye la **distribución de actividades** (A=`ur`, B=`Carlos Z`)
- [ ] El reporte incluye conclusiones y mejoras pendientes (guía DOCX)

### TVH-47 · Presentación final con cambios, métricas y demo en vivo

- **ID:** `TVH-47`
- **Épica:** E11 — Demo en vivo y reporte final
- **Milestone:** M4
- **Asignado:** Persona A
- **Estimado:** 2 pts
- **Labels:** `docs`, `testing`, `p0`
- **Dependencias:** ninguna

**Descripción:** Preparar y ensayar la presentación del proyecto con el flujo completo y la lectura de métricas.

**Criterios de aceptación:**

- [ ] La presentación cubre la descripción del proyecto y la tecnología
- [ ] Se muestra la estrategia de ramas
- [ ] Se ejecuta el cambio → PR → pipeline Dev → aprobación → Prod
- [ ] Se muestran trazas, errores y métricas CPU/memoria/requests

**Criterios añadidos (Bloque B):**

- [ ] **Cada persona explica oralmente el código que implementó** (guía DOCX: «poder explicar el código»)
- [ ] Se usan las **capturas de respaldo** si falla la red durante la demo
