# Guía de verificación de la entrega — Proyecto Final TV Hub

> **Para:** Zataaaa (Carlos Zatarain) · **De:** urielpinag
> **Curso:** ESI3905O O2026 — Infraestructura para el Desarrollo Continuo (DevSecOps), ITESO
> **Fecha:** 2026-11-23 · **Revisado:** 2026-11-24 · **Estado del repo:** único commit `e46821e`, rama `main`, 13 archivos (incluye esta guía)

**Propósito:** que revises que **todo el contenido y la documentación del repo están bien** antes de
empezar a codificar. Este documento reúne el contexto del proyecto, el inventario de lo entregado, la
rúbrica completa de la entrega, un mapa honesto de qué punto de la rúbrica ya está cubierto por la
documentación y cuál todavía no, un checklist de verificación y los pendientes/riesgos abiertos.

---

## Cómo usar este documento

1. **Lee el contexto** (secciones 1 y 2) para entender qué proyecto es, con qué stack y dónde vive cada pieza.
2. **Recorre el checklist** de la sección 6 en el orden indicado; todos los comandos y URLs son de **solo lectura**.
3. **Contrasta el mapa de cobertura** (sección 5): la fase actual es **planificación/documentación**, así que
   lo marcado como 🟡 no es un error, es trabajo planificado.
4. **Ante cualquier discrepancia** (dato que no cuadra, enlace roto, issue mal asignado), abre un issue o
   comenta en el PR; no edites `docs/wiki/*` sin re-publicar la Wiki (ver el cierre).

---

## 1. Contexto del proyecto

### Curso y fuentes de la rúbrica

- Curso **ESI3905O O2026** (ITESO), materia de **DevSecOps**. Material base: guía
  `Guia_Aprendizaje_O2026_ESI3905O.docx` (**material externo del curso, NO versionado en este repo**) y
  diapositivas S1–S17 (**también externas al repo**).
- **La rúbrica detallada de la entrega NO viene de la guía DOCX**, sino de **S13 "DevOps Summary" (slide 16)**.
  La guía DOCX aporta requisitos adicionales (reporte, distribución de actividades, ponderación, IA).
- Existe además una tarea previa de **"presentación del proyecto final"** que es prerrequisito de la entrega.

### Elección del proyecto: TV Hub

- **TV Hub** es una plataforma **IPTV**: registro/login, búsqueda de canales, reproducción **HLS**,
  favoritos e historial; el administrador importa listas **M3U** y hace **CRUD** de canales y usuarios.
- Se eligió frente a la otra propuesta (**DBaaS-Fleet**, cuyos archivos de la propuesta **descartada** ya **no
  están en el repo**), descartada porque no tiene frontend, usaba Hetzner/Cloudfleet y no encajaba con la
  rúbrica. La propuesta elegida está en
  [`TV_Hub_Propuesta_Proyecto_Final.pdf`](TV_Hub_Propuesta_Proyecto_Final.pdf).
- Nota: el "tema libre" **no consta en la guía DOCX** (material externo del curso, no versionado en el repo);
  fue un acuerdo de clase/Canvas.

### Decisiones cerradas (no se reabren)

| # | Decisión | Alternativas descartadas |
|---|----------|--------------------------|
| 1 | **GitHub** (repo, Projects, Wiki, Actions) | Azure DevOps |
| 2 | **AWS** | Azure, Cloudflare |
| 3 | **Amazon EKS + Amazon DocumentDB** | ECS Fargate, MongoDB Atlas, ECR |
| 4 | **Monorepo** `/backend` `/frontend` `/infra` | Multi-repo |
| 5 | **GitHub Flow** (`main` protegida, `feature/*`/`fix/*`/`infra/*` → PR → squash) | GitFlow (solo nota comparativa) |
| 6 | Equipo de **2 personas** (Persona A / Persona B) | — |

### Stack resumido

Node 22 + TypeScript strict · Express 5 · Mongoose → DocumentDB · JWT con refresh rotativo (cookie
HttpOnly) + bcryptjs · frontend HTML/CSS/JS vanilla + Shaka Player (HLS) · Jest + Supertest +
mongodb-memory-server (cobertura **≥ 80 % bloqueante**, artefactos lcov + JUnit) · Docker multi-stage +
**Docker Hub** (`carloszatarain/tvhub-api`) · EKS (Deployments/Services, Ingress NGINX → ALB, HPA 2→5) ·
GitHub Actions con `environments: dev/prod` + required reviewers · **Terraform** en `/infra` · APM
**AWS X-Ray / ADOT (OpenTelemetry) + CloudWatch Logs** · métricas **Container Insights + métricas ALB +
dashboard**. Dominio: **6 entidades** (Users, Sessions, Channels, Playlists, Favorites, WatchHistory) y
**~20 endpoints REST**.

### Equipo y estado de accesos

- **urielpinag** (autor del repo) y **Zataaaa (Carlos Zatarain)**.
- El repo `urielpinag/idc_proyecto` es **PÚBLICO** → hoy puedes **leer todo** (código, Wiki, issues).
- ⚠️ **Tu invitación al repo sigue PENDIENTE** (write, creada 2026-11-23T02:59:00Z): puedes *ver* todo, pero
  **no puedes hacer push ni editar la Wiki** hasta aceptarla.
- Ya tienes **rol Write en el Project #2**, así que puedes mover issues en el tablero.

### Dónde está cada cosa

| Contenido | Ubicación |
|-----------|-----------|
| Repositorio | https://github.com/urielpinag/idc_proyecto |
| Wiki publicada | https://github.com/urielpinag/idc_proyecto/wiki |
| Projects | https://github.com/urielpinag/idc_proyecto/projects |
| Tablero (Project #2) | https://github.com/users/urielpinag/projects/2 |
| Issues | https://github.com/urielpinag/idc_proyecto/issues |
| Fuentes de la Wiki | carpeta `docs/wiki/` (rama `main`) |

---

## 2. Inventario del contenido/documentación del repo

### Archivos trackeados (13)

| Ruta | Qué contiene | Dónde se publica |
|------|--------------|------------------|
| `docs/wiki/README.md` | Índice de la Wiki, estructura del repo y guía de publicación | Repo + Wiki (`Home.md`) |
| `docs/wiki/01-descripcion.md` | Problema, solución, alcance, usuarios, equipo y distribución de actividades | Repo + Wiki |
| `docs/wiki/02-componentes.md` | 6 entidades, métodos, ~20 endpoints y **diagrama de clases** (Mermaid) | Repo + Wiki |
| `docs/wiki/03-stack.md` | Stack y justificación de las 6 decisiones cerradas | Repo + Wiki |
| `docs/wiki/04-infraestructura.md` | Recursos AWS y **diagrama de infraestructura** (Mermaid) | Repo + Wiki |
| `docs/wiki/05-deployment.md` | Pipeline, ambientes Dev/Prod y **diagrama de deployment** (Mermaid) | Repo + Wiki |
| `docs/wiki/06-estrategia-ramas.md` | Ramas, protección de `main`, PRs, commits y nota vs. GitFlow | Repo + Wiki |
| `docs/wiki/07-riesgos.md` | Riesgos **R1–R8** y pendientes de confirmar | Repo + Wiki |
| `docs/backlog.md` | Columnas del tablero, épicas E1–E11 (+E3b), milestones y labels | Repo |
| `docs/issues.md` | Contrato de los **48 issues** (TVH-01…TVH-48) con criterios y asignación | Repo |
| `.github/pull_request_template.md` | Plantilla de PR (checklist autor/revisor, evidencia) | Repo |

La **propuesta elegida** vive en [`TV_Hub_Propuesta_Proyecto_Final.pdf`](TV_Hub_Propuesta_Proyecto_Final.pdf)
(propuesta de TV Hub). Los archivos de la propuesta **descartada** (DBaaS-Fleet) se **eliminaron** del repo.
La `Guia_Aprendizaje_O2026_ESI3905O.docx` es **material externo del curso y no se versiona aquí**.

### Wiki publicada (8 páginas)

Repositorio aparte `idc_proyecto.wiki.git`, rama `master`, **4 commits** de **2 autores** (orden cronológico):
`3e165ff` (Home inicial, vía UI) · `17b6a30` (publicación inicial de las 8 páginas) ·
`739580f` (`ur`: Home, 01, 02, 03) · `c3cbbda` (`Carlos Z`: 04, 05, 06, 07 — HEAD actual).
Contiene `Home.md` + 7 páginas `NN-*.md`, **3 diagramas Mermaid**
(classDiagram, flowchart TB, flowchart LR), **13 enlaces wiki** `[[NN|texto]]` y **4 enlaces absolutos** a
`blob/main`. `has_wiki: true`.

### Gestión del trabajo

- **Project #2 "IDC Proyecto Final - TV Hub"**: de usuario, **privado**, enlazado al repo en ambos
  sentidos, **48 items**, campo `Status` con 5 opciones (Backlog, Ready, In Progress, In Review, Done),
  **48 en Backlog, 0 nulos**, 2 vistas ("View 1" TABLE + "Tablero" BOARD).
- **48 issues** TVH-01…TVH-48, 0 duplicados · milestones **M1=15, M2=23, M3=4, M4=6** · **17 labels**
  (15 de taxonomía + `persona-a`/`persona-b`) · `persona-a`=24 / `persona-b`=24 · **0 assignees** (pendiente).
- **Desacople**: 46/48 sin dependencias; 2 con 1 dependencia intra-track (TVH-39←TVH-37 en Persona A,
  TVH-43←TVH-21 en Persona B); **0 cruzadas A↔B**.
- ⚠️ **Project #1 "DBaaS-Fleet"** existe como proyecto preexistente de la propuesta descartada: **ignóralo**,
  el trabajo va en el **#2**.

---

## 3. Rúbrica oficial (transcripción íntegra)

### 1. Tarea de:

- "presentación del proyecto final".

### 2. Entregar Acceso a Azure DevOps (adaptado a nuestro caso: **GitHub**):

- **Backlog en los tableros**
- **Wiki en (Archivo MD) con:**
  - Descripción del proyecto
  - Componentes que llevará, métodos de estos componentes (preferentemente **diagrama de clases**)
  - **Stack Tecnológico**
  - Recursos que se van a crear (**diagrama de infraestructura**)
  - Incluye el **diagrama de deployment**
- **Repositorio de Infra** con código de **Terraform** para la creación de la Infraestructura
- **Repo o repos con los proyectos:**
  - Backend (**PRs, usar estrategia de ramas**)
  - FrontEnd (**PRs, usar estrategia de ramas**)
- **Pipelines:**
  - BackEnd (Build → Pruebas Unitarias · Ambiente Dev · Ambiente Prod)
  - Frontend (Ambiente Dev · Ambiente Prod)
- **Docker Hub:** Service connection
- **Azure Portal o CloudFlare:** Recursos creados (Backend, Frontent)

### 3. Criterios a Evaluar en la presentación:

- Descripción del proyecto
- Descripción de la tecnología
- **Estrategia de ramas** usadas
- Realizar un cambio en el código
- **Autorizar el PR**
- Ejecutar el pipeline en **Ambiente Desarrollo (Dev)**:
  - Ver el resultado de las **Pruebas Unitarias**
  - Ver el proyecto publicado en el ambiente Dev
- **Aprobar el pipeline a Ambiente Producción (Prod)**:
  - Ver el cambio en Producción en la **URL pública**
- **APM (Trazas, Errores, Mensajes en APM)**
- Mostrar las **métricas** en el portal de Azure o Cloudflare (**CPU, Memoria, Request**)

### 4. Entregables:

- Tarea de presentación del proyecto (entregado previamente)
- Proyecto en Azure DevOps o GitHub

---

## 4. Puntos adicionales a considerar

### De la guía DOCX (Guia_Aprendizaje_O2026_ESI3905O)

- **REST API**, despliegue en **microservicios/web apps con contenedores en la nube**, escalable.
- **Control de errores** y **monitoreo proactivo** (errores, degradaciones, ataques).
- **Scripts de despliegue** de infraestructura (**pipelines**).
- **Reporte** con: descripción, arquitectura, **distribución de actividades**, conclusiones y **mejoras pendientes**.
- Tecnologías vistas en clase: Docker, Kubernetes, Terraform, pipelines YAML, Azure DevOps, Prometheus/Grafana.
- **IA permitida** solo si se mantienen las tecnologías vistas y se **puede explicar el código**.
- Proyecto pesa **33.33 %** de la calificación; se requiere **promedio ≥ 60** para aprobar.
- Cámara encendida si la presentación es remota; entrega vía **Canvas** en fecha/hora acordada.

### De S13 "DevOps Summary" (slide 16)

- BackEnd con **CRUD** + FrontEnd + Pipelines (Build, UAT para BE, Coverage) + **Dockerfile** + Docker Hub.
- Ambientes **Dev/QA/Prod** con **pre-aprobadores**; **Board** Kanban/Scrum; **Branching**; **PR**;
  **Monitoring/Logging/APM**.
- Propuesta con componentes, stack y recursos; arquitectura, **diagrama de infraestructura** y **Terraform**.

### Lo que el curso enseña y lo que no

- **Enseña:** GitHub Actions, `npm test` con JUnit XML y cobertura, `main`+feature→PR→merge, Cloudflare
  Pages/Workers + D1, Kubernetes (minikube).
- **No enseña:** **APM**, **Terraform** ni la obtención de **métricas CPU/Mem/Request** → esfuerzo autodidacta (ver R4).

---

## 5. Mapa de cobertura y justificación

> **Cómo leerlo.** La fase actual es **planificación/documentación**. `✅ Documentado` = la documentación
> cubre el punto tal como se entrega hoy. `🟡 Planificado` = hay un issue que lo implementará, pero **aún no
> existe** código, Terraform, pipeline, Docker Hub real, APM, métricas, PRs ni ambientes Dev/Prod.
> `⚠️ Desviación a confirmar` = cobertura documental válida pero con una discrepancia frente a la rúbrica
> que debe aprobar el profesor. `❌ Pendiente` = sin evidencia ni issue.

### 5.1 Entregables (sección 2 de la rúbrica)

| # | Punto de la rúbrica | Evidencia (ruta / Wiki / issue / Project) | Estado | Justificación |
|---|---------------------|--------------------------------------------|--------|---------------|
| E-01 | Tarea "presentación del proyecto final" (previa) | Cronograma del curso (S1–S17), fuera del repo | ⚠️ Desviación a confirmar | Es un entregable de Canvas previo al proyecto; no deja artefacto en el repo. **Confirmar con el profesor** que la presentación de la fecha final cubre ambas tareas. |
| E-02 | Acceso a la plataforma (adaptado: GitHub) | Repo público `urielpinag/idc_proyecto` | ✅ Documentado | El repo es **público**, la evaluación puede verlo sin invitación. Tu permiso de *write* está pendiente (aceptar invitación). |
| E-03 | Backlog en los tableros | `docs/backlog.md`, Project #2, TVH-14 / TVH-15 | ✅ Documentado | Existen las 5 columnas (Backlog, Ready, In Progress, In Review, Done), 48 issues cargados y 48 items en el Project. Falta solo que el board agrupe por `Status` (configuración de UI, no de contenido). |
| E-04 | Wiki en Markdown: descripción del proyecto | `docs/wiki/01-descripcion.md`, Wiki, TVH-07 | ✅ Documentado | Problema, solución, alcance dentro/fuera, usuarios y distribución de actividades de 2 personas. |
| E-05 | Wiki: componentes y métodos (diagrama de clases) | `docs/wiki/02-componentes.md`, TVH-08 | ✅ Documentado | 6 entidades con campos y métodos, tabla de métodos clave, ~20 endpoints y `classDiagram` Mermaid válido. |
| E-06 | Wiki: Stack Tecnológico | `docs/wiki/03-stack.md`, TVH-09 | ✅ Documentado | Tabla por capa + justificación de las 6 decisiones cerradas y compatibilidad DocumentDB↔Mongoose. |
| E-07 | Wiki: recursos a crear (diagrama de infraestructura) | `docs/wiki/04-infraestructura.md`, TVH-10 | ✅ Documentado | Enumera VPC, subnets, EKS, node group, IAM/OIDC, ALB controller, DocumentDB, SG y CloudWatch, con `flowchart TB`. Los recursos **están diagramados, no creados**. |
| E-08 | Wiki: diagrama de deployment | `docs/wiki/05-deployment.md`, TVH-11 | ✅ Documentado | Flujo PR → Actions → Dev → aprobación → Prod → URL pública en `flowchart LR`. |
| E-09 | Repositorio de Infra con código Terraform | `docs/wiki/04-infraestructura.md` (diseño), issues TVH-16, TVH-17, TVH-18, TVH-19, TVH-20, TVH-22, TVH-40 | ⚠️ Desviación a confirmar | Hoy solo existe el **diseño** de la infraestructura; **no hay código Terraform** ni carpeta `infra/`. La rúbrica pide un "repositorio de Infra"; se resolvió como **monorepo `/infra`** (decisión cerrada #4) → confirmar que se acepta. |
| E-10 | Backend con PRs y estrategia de ramas | `docs/wiki/06-estrategia-ramas.md`, `.github/pull_request_template.md`, TVH-01, TVH-02, TVH-03, TVH-04 | 🟡 Planificado | La estrategia y la plantilla de PR ya existen; **el backend y sus PRs aún no**. Lo implementan TVH-04 y los issues de E3b. |
| E-11 | Frontend con PRs y estrategia de ramas | `docs/wiki/06-estrategia-ramas.md`, TVH-05, TVH-38 | 🟡 Planificado | Igual que E-10: estrategia documentada, **frontend sin implementar**. |
| E-12 | Pipeline Backend: Build → Pruebas Unitarias | TVH-34, TVH-35 | 🟡 Planificado | Documentado en `05-deployment.md`; **no hay workflow** en `.github/workflows/`. |
| E-13 | Pipeline Backend: Ambiente Dev | TVH-36, TVH-23 | 🟡 Planificado | Deploy a namespace `dev` de EKS definido; sin entorno real ni URL pública. |
| E-14 | Pipeline Backend: Ambiente Prod | TVH-37, TVH-39 | 🟡 Planificado | Gate con `required reviewers` documentado; el Environment `prod` **no está creado**. |
| E-15 | Pipeline Frontend: Ambiente Dev | TVH-38, TVH-24 | 🟡 Planificado | Workflow de frontend y deploy a Dev planificados, sin ejecución. |
| E-16 | Pipeline Frontend: Ambiente Prod | TVH-39 | 🟡 Planificado | Reutiliza el gate de Prod del backend; depende de TVH-37. |
| E-17 | Docker Hub: Service connection | `03-stack.md`, `05-deployment.md`, TVH-26, TVH-27, TVH-28 | 🟡 Planificado | Definido el equivalente (**GitHub Secrets + rol IAM vía OIDC**) y los repos `tvhub-api`/`tvhub-web`; **no hay imágenes publicadas**. |
| E-18 | Portal Azure/CloudFlare: recursos creados (Backend, Frontend) | `04-infraestructura.md` (CloudWatch), R1, TVH-23, TVH-24 | ⚠️ Desviación a confirmar | Con AWS los recursos y métricas se muestran en **CloudWatch / consola AWS**. **R1 pendiente con el profesor**. |

### 5.2 Criterios a evaluar en la presentación (sección 3)

| # | Punto de la rúbrica | Evidencia (ruta / Wiki / issue / Project) | Estado | Justificación |
|---|---------------------|--------------------------------------------|--------|---------------|
| C-01 | Descripción del proyecto | `docs/wiki/01-descripcion.md`, TVH-07, TVH-47 | ✅ Documentado | Hay descripción escrita; en la demo debe **explicarse en vivo** (TVH-47). |
| C-02 | Descripción de la tecnología | `docs/wiki/03-stack.md`, TVH-09, TVH-47 | ✅ Documentado | Stack y justificación completos; requiere explicación oral. |
| C-03 | Estrategia de ramas usadas | `docs/wiki/06-estrategia-ramas.md`, TVH-02, TVH-12 | ✅ Documentado | GitHub Flow documentado; **falta aplicarla** (proteger `main`, PRs reales). |
| C-04 | Realizar un cambio en el código | TVH-45, TVH-47 | ❌ Pendiente | **No hay código** que cambiar todavía; se ejecuta en el ensayo de demo (M4). |
| C-05 | Autorizar el PR | `.github/pull_request_template.md`, TVH-02, TVH-45 | 🟡 Planificado | Existe la plantilla y la regla "nadie aprueba su propio PR"; **no hay PR real**. |
| C-06 | Pipeline en Dev: resultado de Pruebas Unitarias | TVH-34, TVH-35 (cobertura ≥80 % bloqueante, lcov + JUnit) | 🟡 Planificado | Suite y workflow planificados; **sin tests ejecutables** ni artefactos. |
| C-07 | Pipeline en Dev: proyecto publicado en Dev | TVH-36, TVH-23, TVH-20 | 🟡 Planificado | URL pública vía ALB documentada; **no existe ambiente Dev**. |
| C-08 | Aprobar pipeline a Prod: cambio visible en URL pública | TVH-37, TVH-39, TVH-20 | 🟡 Planificado | Gate de aprobación documentado; **sin Prod ni URL pública**. |
| C-09 | APM: Trazas, Errores, Mensajes | `03-stack.md`, `04-infraestructura.md`, TVH-41, TVH-42 | 🟡 Planificado | Instrumentación X-Ray/ADOT prevista; **no hay APM operando**. R1b/4 (no se enseña en el curso). |
| C-10 | Métricas CPU, Memoria, Request | `04-infraestructura.md`, TVH-21, TVH-43, TVH-44 | ⚠️ Desviación a confirmar | Container Insights + métricas ALB + dashboard planificados; **sin datos reales**. Mismo desvío R1 que E-18 ("portal de Azure o Cloudflare"). |

### 5.3 Entregables (sección 4)

| # | Punto de la rúbrica | Evidencia (ruta / Wiki / issue / Project) | Estado | Justificación |
|---|---------------------|--------------------------------------------|--------|---------------|
| T-01 | Tarea de presentación del proyecto (entregada previamente) | Fuera del repo (Canvas) | ⚠️ Desviación a confirmar | Ver E-01: debe confirmarse con el profesor cómo se computa. |
| T-02 | Proyecto en Azure DevOps o GitHub | Repo + Wiki + Project #2 | ✅ Documentado | El proyecto **está en GitHub** con repo, Wiki y tablero, que es la opción permitida por la rúbrica ("o GitHub"). |

**Resumen del mapa:** **30 filas** en total (18 de entregables, 10 de criterios, 2 de entregables §4):
**11 `✅ Documentado`**, **13 `🟡 Planificado`**, **5 `⚠️ Desviación a confirmar`** y **1 `❌ Pendiente`**.
Ningún punto de la rúbrica queda sin justificación; lo que falta es **implementación**, no documentación.

> Nota (Bloque B): los 3 huecos de la retro ya tienen criterios en `TVH-02`, `TVH-45`, `TVH-46` y `TVH-47`.
> Los estados de esta tabla no cambian: lo implementado sigue siendo trabajo planificado.

---

## 6. Checklist de verificación para el compañero

Todos los comandos son **de solo lectura**.

### Repo

```bash
git -C <repo> status --short      # debe estar limpio (salvo este .md si lo abres tú)
git -C <repo> log -1 --oneline    # debe mostrar el único commit e46821e
git -C <repo> ls-files            # debe listar 13 archivos (incluye esta guía)
git -C <repo> ls-files | wc -l    # debe imprimir 13
git -C <repo> remote -v           # solo origin (SSH git@github.com:urielpinag/idc_proyecto.git)
```

- [ ] Hay **13 archivos** trackeados, sin archivos inesperados.
- [ ] `origin` es el único remoto; el repo es público.
- [ ] Los 13 archivos del inventario (sección 2) coinciden uno a uno.
  El total incluye esta propia guía (`docs/revision-entrega.md`).

### Wiki

```bash
git ls-remote https://github.com/urielpinag/idc_proyecto.wiki.git
```

- [ ] `refs/heads/master` existe (publicación actual: `c3cbbda`).
- [ ] Abre https://github.com/urielpinag/idc_proyecto/wiki y cuenta **8 páginas**.
- [ ] Los **3 diagramas Mermaid** renderizan: clases (02), infraestructura (04) y deployment (05).
- [ ] Los **13 enlaces** `[[NN|texto]]` y los **4 enlaces absolutos** a `blob/main` resuelven.

### Project

```bash
gh project list --owner urielpinag
gh project field-list 2 --owner urielpinag
gh project item-list 2 --owner urielpinag --limit 50 --format json
```

- [ ] El **Project #2** "IDC Proyecto Final - TV Hub" existe y está **enlazado al repo**.
- [ ] Hay **48 items**, **0 con `Status` nulo**.
- [ ] `Status` tiene exactamente **5 opciones**: Backlog, Ready, In Progress, In Review, Done.
- [ ] Hay 2 vistas: "View 1" (TABLE) y "Tablero" (BOARD).
- [ ] ⚠️ `groupByFields` está vacío → el board **no agrupa por Status todavía** (se arregla en la UI).
- [ ] No confundir con el **Project #1 "DBaaS-Fleet"** (preexistente, de la propuesta descartada).

### Issues

```bash
gh issue list --repo urielpinag/idc_proyecto --limit 100 --state all
gh issue list --repo urielpinag/idc_proyecto --state all --json number,milestone,labels
```

- [ ] **48 issues** TVH-01…TVH-48, **0 duplicados**.
- [ ] Milestones: **M1=15, M2=23, M3=4, M4=6**.
- [ ] **17 labels**: 15 de taxonomía + `persona-a` / `persona-b`.
- [ ] `persona-a`=**24**, `persona-b`=**24**.
- [ ] **46/48** sin dependencias; solo **TVH-39←TVH-37** y **TVH-43←TVH-21** (ambas intra-track).
- [ ] `docs/backlog.md` (columnas y épicas) coincide con las opciones de `Status` y con los milestones del board.
- [ ] ⚠️ **0 assignees**: nadie tiene los issues asignados todavía (pendiente del equipo).

---

## 7. Pendientes y puntos a considerar antes de la entrega

1. **Confirmar R1 y R1b con el profesor** antes de construir observabilidad. Preguntas concretas:
   1. ¿Se acepta **AWS + CloudWatch** donde la rúbrica dice "Azure Portal o CloudFlare"?
   2. ¿Se acepta **CloudWatch + X-Ray/ADOT** en lugar de **Prometheus/Grafana**?
   3. ¿Se acepta el **monorepo con `/infra`** como "repositorio de Infra"?
   4. ¿Cómo se computa la tarea previa "presentación del proyecto final" frente a la presentación final?
2. **Zataaaa debe aceptar la invitación al repo** (write, pendiente): sin eso no hay push ni edición de Wiki.
3. **Asignar los issues** (24 Persona A + 24 Persona B) y quitar el estado `0 assignees`.
4. **Fijar `groupBy=Status` en la vista "Tablero"** del Project #2 (configuración de UI).
5. **Proteger `main`** con PR + 1 aprobación de la otra persona (TVH-02), alineado con `06-estrategia-ramas.md`;
   **en ejecución en el Bloque B**.
6. **Ignorar el Project #1 "DBaaS-Fleet"**: todo el trabajo va en el **#2**.
7. **Gestionar el drift** entre `docs/wiki/*.md` (fuente canónica en `main`) y la Wiki publicada: cualquier
   edición debe re-publicarse en `idc_proyecto.wiki.git`.
8. **Revocar la credencial y el respaldo `.bak`** expuestos y duplicados; queda pendiente de limpieza.
9. **Ejecutar los pasos 4 y 5** del plan: **código (Bloque C**, E3b, TVH-04/05/29–33, a la espera del profesor)
   y **pipelines + infra** (E4–E8, TVH-16…TVH-40), luego observabilidad (E9–E10) y demo (E11).

**Cerrado en esta ronda (Bloque B):** los 3 huecos de la retro ya tienen criterios añadidos en
**TVH-02** (revisión cruzada de cada PR), **TVH-45** (capturas de respaldo de la demo) y **TVH-46 / TVH-47**
(mapa de cobertura 🟡→✅ y explicación oral del código), sin crear issues nuevos (siguen 48).
**En ejecución en el Bloque B:** proteger `main`, asignar 24 + 24 issues y `groupBy=Status`.

---

## 8. Riesgos

Detalle completo en [`wiki/07-riesgos.md`](wiki/07-riesgos.md) (R1–R8). Aquí se separan por origen.

### Heredados del curso / material (fuentes en conflicto) **Ponderación:** el proyecto es **33.33 %** y exige **promedio ≥ 60** para aprobar.

### Derivados de nuestras decisiones

- **R2** — Coste real de **EKS + DocumentDB** (sin free tier); mitigación con apagado/recorte (TVH-48).
- **R3** — **Compatibilidad DocumentDB (~MongoDB 3.6/4.0) ↔ MongoDB 8 + Mongoose**: fijar versiones y validar
  CRUD + sync M3U en Dev antes de cerrar el stack (TVH-29).
- **CloudWatch vs Azure/Cloudflare** — mismo riesgo que R1 aplicado a las **métricas**.
- **Prometheus/Grafana ↔ CloudWatch/X-Ray** — mismo riesgo que R1b aplicado al **monitoreo**.
- **IaC pesada** (Terraform + EKS + ALB controller + IRSA) para un equipo de 2 personas: curva de aprendizaje alta.
- **R5** — Dependencia de **listas M3U/HLS de terceros**: usar un set fijo de canales de prueba y validarlos
  antes de la demo.

---

> Si encuentras una discrepancia, abre un issue o comenta en el PR; no edites `docs/wiki/*` sin re-publicar la Wiki.
