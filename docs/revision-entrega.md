# Proyecto Final TV Hub — Guía de lectura

> **Para:** ur (Persona A) · **Curso:** ESI3905O O2026 — Infraestructura para el Desarrollo Continuo (DevSecOps), ITESO
> **Fecha:** 2026-11-25 · **Estado:** planificación completa, código pendiente

Esta es una **guía de lectura**, no un checklist: su objetivo es que en una sola pasada entiendas
cómo TV Hub va a cumplir la rúbrica completa, qué ya está hecho, qué decisiones se tomaron y qué
falta exactamente para arrancar a escribir código.

---

## Cómo leer este documento

- **Secciones 1 y 2** te dan el qué: el proyecto en 10 líneas y la rúbrica transcripta íntegra en tabla.
- **Sección 3 es la central**: bloque por bloque de la rúbrica, **cómo** lo cumplimos, con qué issues,
  dónde está la evidencia y **qué falta** para pasar de 🟡 a ✅.
- **Secciones 4 a 7** son la foto del estado real, las decisiones cerradas, la única validación
  pendiente (cuenta AWS) y el orden de trabajo del Bloque C.
- **Sección 8** separa los riesgos heredados del curso de los que derivan de nuestras decisiones.
- El detalle ficha a ficha (30 filas de cobertura) está en el **Anexo A**; las rutas en el **Anexo B**.

---

## 1. El proyecto en 10 líneas

**TV Hub** es una plataforma **IPTV**: el problema que resuelve es administrar y consumir canales de
TV sobre HLS sin depender de la interfaz del proveedor. Registro/login, búsqueda de canales por
nombre/país/categoría, reproducción **HLS** con Shaka Player, favoritos e historial; el admin
importa listas **M3U**, hace **CRUD** de canales y usuarios y hace **re-sync sin duplicados**
(`/api/playlists/sync`).

- **6 entidades**: Users, Sessions, Channels, Playlists, Favorites, WatchHistory.
- **~20 endpoints REST**: `/api/auth`, `/api/users`, `/api/channels`, `/api/playlists` (+ `/sync`),
  `/api/favorites`, `/api/history` (+ `/top`), `/health`, `/ready`.
- **Stack**: Node 22 + TypeScript strict · Express 5 · Mongoose → DocumentDB · JWT (refresh rotativo,
  cookie HttpOnly) + bcryptjs · frontend HTML/CSS/JS vanilla + Shaka Player · Jest + Supertest +
  mongodb-memory-server (cobertura **≥ 80 % bloqueante**, lcov + JUnit) · Docker multi-stage ·
  GitHub Actions · Terraform.
- Se eligió frente a la propuesta descartada **DBaaS-Fleet** (sin frontend, Hetzner/Cloudfleet, no
  encajaba con la rúbrica). Propuesta elegida:
  [`TV_Hub_Propuesta_Proyecto_Final.pdf`](TV_Hub_Propuesta_Proyecto_Final.pdf).

| Decisión de plataforma | Valor | Alternativas descartadas |
|---|---|---|
| Plataforma de gestión | **GitHub** (repo, Projects, Wiki, Actions) | Azure DevOps |
| Nube | **AWS** | Azure, Cloudflare |
| Cómputo y base de datos | **Amazon EKS + Amazon DocumentDB** | ECS Fargate, Atlas, ECR |
| Registry | **Docker Hub** (`piniaops/tvhub-api`, `tvhub-web`) | ECR |
| Organización | **Monorepo** `/backend` `/frontend` `/infra` | Multi-repo |
| Observabilidad | **AWS X-Ray/ADOT + CloudWatch** | Prometheus/Grafana |

---

## 2. Qué exige la rúbrica

La rúbrica detallada proviene de **S13 "DevOps Summary" (slide 16)**, no de la guía DOCX; la guía
aporta requisitos adicionales (§5) y la tarea de presentación es prerrequisito (§1, §4).

| Bloque | Punto | Qué se evalúa |
|---|---|---|
| §1 Tarea | Presentación previa | "Presentación del proyecto final" |
| §2 Entregable | Backlog | Backlog en los tableros |
| §2 Entregable | Wiki (MD, a) | Descripción del proyecto |
| §2 Entregable | Wiki (MD, b) | Componentes que llevará + métodos (preferentemente **diagrama de clases**) |
| §2 Entregable | Wiki (MD, c) | **Stack Tecnológico** |
| §2 Entregable | Wiki (MD, d) | Recursos que se van a crear (**diagrama de infraestructura**) |
| §2 Entregable | Wiki (MD, e) | **Diagrama de deployment** |
| §2 Entregable | Infra | **Repositorio de Infra** con código de **Terraform** |
| §2 Entregable | Backend | Repo backend con **PRs y estrategia de ramas** |
| §2 Entregable | Frontend | Repo frontend con **PRs y estrategia de ramas** |
| §2 Entregable | Pipeline Backend | **Build → Pruebas Unitarias** · **Ambiente Dev** · **Ambiente Prod** |
| §2 Entregable | Pipeline Frontend | **Ambiente Dev** · **Ambiente Prod** |
| §2 Entregable | Docker Hub | **Service connection** |
| §2 Entregable | Recursos creados | **Azure Portal o CloudFlare**: recursos creados (Backend, Frontend) |
| §3 Criterios | 1 | Descripción del proyecto |
| §3 Criterios | 2 | Descripción de la tecnología |
| §3 Criterios | 3 | **Estrategia de ramas** usadas |
| §3 Criterios | 4 | Realizar un cambio en el código |
| §3 Criterios | 5 | **Autorizar el PR** |
| §3 Criterios | 6a | Pipeline en **Dev**: ver resultado de **Pruebas Unitarias** |
| §3 Criterios | 6b | Pipeline en **Dev**: ver proyecto publicado en Dev |
| §3 Criterios | 7 | **Aprobar pipeline a Prod**: ver cambio en la **URL pública** |
| §3 Criterios | 8 | **APM: Trazas, Errores, Mensajes** |
| §3 Criterios | 9 | **Métricas CPU, Memoria, Request** en el portal de Azure o Cloudflare |
| §4 Entregable | Presentación | Tarea de presentación (entregada previamente) |
| §4 Entregable | Proyecto | Proyecto en **Azure DevOps o GitHub** |
| §5 Guía DOCX | API y despliegue | REST API generada en clase; microservicios/web apps con contenedores; escalable |
| §5 Guía DOCX | Calidad | Control de errores; monitoreo proactivo (errores, degradaciones, ataques) |
| §5 Guía DOCX | Scripts | Scripts de despliegue de infraestructura (**pipelines**) |
| §5 Guía DOCX | Reporte | Reporte con descripción, arquitectura, **distribución de actividades**, conclusiones y mejoras pendientes |
| §5 Guía DOCX | Tecnologías | Docker, Kubernetes, Terraform, pipelines YAML, Azure DevOps, Prometheus/Grafana (se permite AWS y GitHub) |
| §5 Guía DOCX | IA | Permitida solo si se mantienen las tecnologías vistas y se puede explicar el código |
| §5 Guía DOCX | Evaluación | Proyecto pondera **33.33 %**; aprobar con **promedio ≥ 60**; cámara encendida si es remota; entrega vía Canvas |
| §6 S13 slide 16 | Extras | CRUD backend + frontend; Pipelines (Build, UAT BE, **Coverage**); **Dockerfile + Docker Hub**; Dev/QA/Prod con pre-aprobadores; Board Kanban/Scrum + Branching + PR; **Monitoring/Logging/APM**; propuesta + arquitectura + diagrama de infraestructura + **Terraform** |

> El "tema libre" **no consta en la guía DOCX** (material externo del curso, no versionado aquí);
> fue un acuerdo de clase/Canvas. La `Guia_Aprendizaje_O2026_ESI3905O.docx` y las diapositivas S1–S17
> son **material externo no versionado**.

---

## 3. Cómo vamos a cumplirla, bloque por bloque

Antes de los bloques, el diagnóstico honesto: **el proyecto tiene todo el plan pero no el producto**.
Hoy no existe `/backend`, `/frontend` ni `/infra`, ni workflows de CI, ni PRs, ni pipeline Dev/Prod,
ni APM, ni métricas, ni URL pública. Lo que existe es repo, Wiki (8 páginas), 48 issues y Project #2.
Por eso el mapa tiene **11 ✅ documentado, 13 🟡 planificado, 5 ⚠️ desviación confirmada (25 nov 2026) y 1 ❌
pendiente** (ver Anexo A).

**Leyenda de estados.** ✅ **Documentado** = evidencia ya publicada (repo/Wiki/Project). 🟡 **Planificado**
= issue asignado pero aún sin código. ⚠️ **Desviación confirmada (25 nov 2026)** = cobertura documental válida con
discrepancia frente a la letra de la rúbrica que debe aprobar el profesor. ❌ **Pendiente** = no hay
código sobre el cual ejecutar el punto.

### 3.1 Backlog y Wiki (§2: Backlog + 5 contenidos)

- **Backlog en los tableros** — ✅ Documentado. `docs/backlog.md` define las 5 columnas
  (Backlog/Ready/In Progress/In Review/Done) y el **Project #2** tiene los 48 items con ese `Status`
  (`TVH-14/15`). Lo que falta: fijar `groupBy=Status` en la vista "Tablero" (solo por UI).
- **Wiki, contenido a) descripción** — ✅ `docs/wiki/01-descripcion.md` (`TVH-07`): problema, solución,
  alcance, usuarios y distribución de actividades de 2 personas.
- **Wiki, contenido b) componentes + diagrama de clases** — ✅ `docs/wiki/02-componentes.md` (`TVH-08`):
  6 entidades con campos/métodos, ~20 endpoints y `classDiagram` Mermaid.
- **Wiki, contenido c) stack** — ✅ `docs/wiki/03-stack.md` (`TVH-09`).
- **Wiki, contenido d) recursos + diagrama de infraestructura** — ✅ `docs/wiki/04-infraestructura.md`
  (`TVH-10`): VPC, subnets, EKS, node group, IAM/OIDC, ALB Controller, DocumentDB, SG, CloudWatch con
  `flowchart TB`. Los recursos **están diagramados, no creados**.
- **Wiki, contenido e) diagrama de deployment** — ✅ `docs/wiki/05-deployment.md` (`TVH-11`): PR →
  Actions → Dev → aprobación → Prod en `flowchart LR`.

Todos los contenidos de la Wiki están **publicados** (`idc_proyecto.wiki.git`, HEAD `c3cbbda`);
no hace falta nada más para que ese bloque sea ✅.

### 3.2 Infraestructura con Terraform (§2)

⚠️ **Desviación confirmada (25 nov 2026).** Hoy solo existe el diseño en `docs/wiki/04-infraestructura.md`; **no hay
código Terraform ni carpeta `/infra`**. La rúbrica pide un "repositorio de Infra"; se resolvió como
**monorepo con `/infra`** (decisión cerrada). Lo ejecutan `TVH-16` (VPC + remote state), `TVH-17` (EKS),
`TVH-18` (IAM/OIDC), `TVH-19` (DocumentDB), `TVH-20` (LB Controller/Ingress), `TVH-22` y `TVH-40`.
**Falta**: escribir los módulos y aplicarlos; además confirmar que el monorepo se acepta como "repo de Infra".

### 3.3 Repos backend/frontend con PRs y estrategia de ramas (§2)

🟡 **Planificado.** La estrategia (**GitHub Flow**: `main` protegida + `feature/*`/`fix/*`/`infra/*` →
PR → squash) y la plantilla `.github/pull_request_template.md` ya existen en
`docs/wiki/06-estrategia-ramas.md`. Lo que **falta** es el producto: scaffold backend (`TVH-04`), scaffold
frontend Shaka (`TVH-05`) y los primeros PRs reales. `main` ya está protegida con 1 aprobación de la
otra identidad (`enforce_admins:false`), así que la regla está operativa desde el primer commit de código.

### 3.4 Pipelines (§2: Backend Build+Pruebas Unitarias/Dev/Prod · Frontend Dev/Prod)

🟡 **Planificado.** El flujo está documentado en `docs/wiki/05-deployment.md`: merge a `main` → build +
pruebas unitarias + cobertura **≥ 80 % bloqueante** (JUnit XML + lcov) → **Dev automático** →
**aprobación manual** → **Prod**. Lo implementan `TVH-34/35` (build + tests), `TVH-36/23` (Dev backend),
`TVH-37/39` (gate Prod) y `TVH-38` (frontend). **Falta**: los workflows YAML en `.github/workflows/`
y los Environments `dev`/`prod` con `required reviewers`.

### 3.5 Docker Hub y recursos creados (§2)

- **Docker Hub / Service connection** — 🟡 Planificado (`TVH-26/27/28`): el equivalente acordado es
  **GitHub Secrets + rol IAM vía OIDC** (lo que en Azure DevOps sería el "service connection") y los
  repos `tvhub-api`/`tvhub-web`. **Falta**: Dockerfiles y primera imagen publicada.
- **Recursos creados (Azure Portal o CloudFlare)** — ⚠️ **Desviación confirmada (25 nov 2026)** (`E-18`, R1). Con AWS
  los recursos y métricas se muestran en la **consola AWS / CloudWatch**; la guía DOCX permite AWS, pero
  la tarea de presentación menciona Azure/Cloudflare. **Falta**: confirmación del profesor y los
  recursos reales (`TVH-23/24`).

### 3.6 Criterios de la presentación (§3)

| Criterio | Estado | Cómo se cumple / qué falta |
|---|---|---|
| Descripción del proyecto | ✅ | `01-descripcion.md`; se explica en vivo (`TVH-47`) |
| Descripción de la tecnología | ✅ | `03-stack.md`; explicación oral (`TVH-47`) |
| Estrategia de ramas usada | ✅ | `06-estrategia-ramas.md`; falta **aplicarla** con PRs reales |
| Realizar un cambio en el código | ❌ | `TVH-45/47`: **no hay código que cambiar aún**; se ensaya en M4 |
| Autorizar el PR | 🟡 | Plantilla + regla "nadie aprueba su propio PR"; falta un PR real |
| Dev: resultado de pruebas unitarias | 🟡 | Suite + workflow planificados; sin tests ejecutables |
| Dev: proyecto publicado | 🟡 | URL vía ALB documentada; no existe ambiente Dev |
| Prod: cambio visible en URL pública | 🟡 | Gate documentado; sin Prod ni URL |
| APM: trazas, errores, mensajes | 🟡 | X-Ray/ADOT previsto (`TVH-41/42`); sin APM operando |
| Métricas CPU/Memoria/Request | ⚠️ | Container Insights + ALB + dashboard (`TVH-43/44`); sin datos; desvío R1 |

La fila ❌ (C-04) es la única sin issue de "hacer": **no significa que falte plan**, sino que todavía no
hay código que modificar. En cuanto exista `/backend` (Paso 1/M1) pasará a 🟡 y, cuando se ensaye la
demo (M4), a ✅.

### 3.7 Reporte y cierre del curso (§4, §5, §6)

- **Proyecto en GitHub** — ✅ (`T-02`): repo público + Wiki + Project #2 cumplen "Azure DevOps **o** GitHub".
- **Tarea previa de presentación** — ⚠️ (`E-01`/`T-01`): entregable de Canvas sin artefacto en el repo;
  falta confirmar cómo se computa frente a la presentación final.
- **Reporte con distribución de actividades** — 🟡 `TVH-46`: cierra el último entregable del curso
  (descripción, arquitectura, reparto 24/24, conclusiones y mejoras pendientes).
- **Tecnologías vistas (Prometheus/Grafana)** — ⚠️ R1b: se sustituyen por CloudWatch/X-Ray; S13 no las
  nombra, pero la guía sí. Pendiente con el profesor.
- **Monitoreo/Logging/APM y Terraform de S13** — 🟡 `TVH-41/42/43/44` y `/infra`.

---

## 4. Estado real hoy (25 nov 2026)

**Foto fechada** al cierre del Bloque B; los datos de "0 PRs / 4 commits / 13 archivos" describen ese
instante, no son una verdad permanente. *Publicar esta propia guía añadirá un commit más* a la foto.

| Dimensión | Estado al 2026-11-25 |
|---|---|
| Repo / rama | `urielpinag/idc_proyecto` (público) · rama `main` · principal `e46821e` (root) |
| HEAD | **`dbe73f4`** · historial `e46821e` → `c0c6c28` → `a3a4df5` → `dbe73f4` |
| Commits | **4** (2 de `ur`, 1 de `Carlos Z`, 1 root de `ur`) |
| Archivos trackeados | **13** · working tree limpio · solo `origin` como remoto |
| PRs | **0** (foto del 25 nov; el primer PR llegará con el código del Bloque C) |
| Wiki | `idc_proyecto.wiki.git`, rama `master`, HEAD **`c3cbbda`**, **8 páginas** (Home + 01..07) |
| Wiki detalle | **3 Mermaid** (clases/infra/deployment) · **13 enlaces** `[[NN|texto]]` · 4 URLs al PDF · **4 commits** |
| Issues | **48** (`TVH-01..48`), 0 duplicados · asignados **24 `urielpinag` / 24 `Zataaaa`** |
| Milestones | **M1=15 · M2=23 · M3=4 · M4=6** · `persona-a`=24 / `persona-b`=24 · 17 labels |
| Project #2 | "IDC Proyecto Final - TV Hub", privado, enlazado al repo, **48 items** todos en Backlog |
| Project #2 detalle | `Status` con **5 opciones** · **2 vistas** (View 1 TABLE + Tablero BOARD) |
| Protección | `main` con PR + **1 aprobación** de la otra identidad · `enforce_admins:false` · sin status checks |
| Identidades | Persona A = `ur`/`urielpinag` (admin) · Persona B = `Carlos Z`/`Zataaaa` (write) |

**Ausente**: `/backend`, `/frontend`, `/infra`, workflows de CI, PRs, pipeline Dev/Prod, APM, métricas y
URL pública. **No hay código.** El Bloque C **no espera la respuesta del profesor** (R1/R1b confirmados el
25 nov 2026): **espera solo la cuenta AWS con tope de gasto**.

---

## 5. Decisiones ya tomadas

| Decisión | Valor | Por qué |
|---|---|---|
| Plataforma | **GitHub** | Cubre repo, Projects, Wiki y Actions; la rúbrica admite "o GitHub" |
| Nube | **AWS** | Permitida por la guía DOCX; con tope de gasto |
| Cómputo + BD | **EKS + DocumentDB** | Contenedores gestionados + DB compatible Mongo |
| Registry | **Docker Hub** | Es lo que nombra la rúbrica |
| Organización | **Monorepo** `/backend` `/frontend` `/infra` | Evita sincronizar 3 repos; `/infra` cumple el "repo de Infra" |
| Estrategia de ramas | **GitHub Flow** (`main` protegida + `feature/*`/`fix/*`/`infra/*` → PR → squash) | Simple para 2 personas; GitFlow solo nota comparativa |
| Despliegue a Dev | **Solo tras merge a `main`** | Dev refleja lo aprobado, no ramas en vuelo |
| Roles | `ur` = Persona A/admin · `Carlos Z` = Persona B/write | Cada quien explica su código |
| Emails de commit | ambos usan `noreply@users.noreply.github.com` | Atribución correcta por email del autor |
| Aprobación de PR | **1 aprobación de la otra identidad** | Revisión cruzada: nadie aprueba su propio PR |
| Huecos de la retro | Cerrados **ampliando criterios** en `TVH-02/45/46/47` | Sin crear issues nuevos: siguen **48** |
| Listas M3U | **Fixtures sintéticos propios** | Los `.m3u` de `tv.hub` traían `token=`/JWT: no se copian |
| Credenciales | Limpieza **diferida** (revocar el PAT al terminar la demo) | Revocar ahora mataría el MCP de `Zataaaa` |

> **"Unverified" en GitHub** es una insignia de **firma** de commit, no de autoría: los commits salen
> como `unsigned` y **no afecta** a quién aparece como autor ni a la rúbrica. La autoría depende del
> **email del autor**, no de la credencial de push (un solo SSH empuja los commits de ambos).

---

## 6. Decisiones pendientes para arrancar el código

**No hay decisiones de diseño pendientes**: el producto ya está definido. Las **4 preguntas al profesor
(R1/R1b) quedaron resueltas el 25 nov 2026** y las 2 notificaciones están atendidas. Queda **una sola
validación externa**: la **cuenta AWS con tope de gasto**.

### 6.1 Resueltas el 25 nov 2026 (R1 / R1b)

Cuatro preguntas literales y su respuesta:

1. ¿Podemos entregar en **GitHub + AWS (EKS + DocumentDB)**? → *(i)* **«Para GitHub + AWS/EKS/DocumentDB,
   sí está bien ese stack tecnológico»** → **CONFIRMADO**.
2. ¿Acepta **CloudWatch + AWS X-Ray/ADOT** para APM (trazas/errores/mensajes) y métricas CPU/Memoria/Request
   en lugar del portal de Azure o Cloudflare? → *(ii)* **«Para CloudWatch + X-Ray/ADOT para APM, está bien
   también ya que es lo que mejor se va a adaptar con las herramientas que elegimos»** → **CONFIRMADO**.
3. ¿El **"service connection a Docker Hub"** se satisface con **GitHub Secrets + rol IAM vía OIDC**? → *(iii)*
   agrupado en «Los demás puntos»: válido → **CONFIRMADO**.
4. La guía nombra **Prometheus/Grafana** como tecnología vista: ¿debemos incluirlo? → *(iv)* **«no es
   necesario lo de Prometheus/Grafana ya que ya tenemos las otras como herramientas para observabilidad»**
   → **DESCARTADO con autorización**.

**Justificación técnica** (a petición del profesor: «Solo que hay que justificar todas estas decisiones»):

- **(i) GitHub + AWS / EKS + DocumentDB** — la guía DOCX permite *«AWS, Microsoft Azure, u otro»* y *«código
  en GitHub o Azure DevOps»*: la plataforma es válida sin excepción. **EKS** lleva a la nube el **Kubernetes**
  visto en clase (S14/minikube: Deployment, Service, Ingress, HPA, metrics-server) y conserva Docker;
  **DocumentDB** es el equivalente gestionado de **MongoDB/Mongoose** de la propuesta, sin operar un
  StatefulSet. Se conservan las tecnologías vistas y el código es explicable por el equipo (regla de IA).
- **(ii) CloudWatch + X-Ray/ADOT** — suite **nativa de AWS**: CloudWatch Logs (errores/mensajes), X-Ray/ADOT
  (trazas distribuidas), Container Insights (CPU/Memoria de pods) y métricas del ALB (Request) unificadas en
  un dashboard. Azure Monitor/Cloudflare no aplican (no hay recursos allí); cubre APM y métricas de la rúbrica.
- **(iii) Docker Hub + GitHub Secrets + rol IAM vía OIDC** — sustituye la *service connection* de Azure DevOps
  por el equivalente en GitHub Actions, **sin credenciales estáticas** (más seguro que access keys). Se
  mantiene **Docker Hub** como registry (no ECR).
- **(iv) Sin Prometheus/Grafana** — **S13 slide 16** pide «Monitoring | Logging | APM» sin imponer herramienta
  y el profesor lo autorizó. Añadirlos duplicaría la instrumentación y no se integran nativos con AWS →
  **excepción justificada y autorizada**.

**Qué desbloquea**: la tecnología de **observabilidad** y la forma de mostrar **recursos y métricas** queda
cerrada; el Bloque C **ya no espera respuesta del profesor**.

### 6.2 Notificaciones al profesor (atendidas)

1. Cambio de **individual a equipo de 2**.
2. Cambio de propuesta **minikube → AWS/EKS**.

Ambas quedan registradas por escrito; no requieren nueva respuesta.

### 6.3 Única validación pendiente: cuenta AWS con tope de gasto

**Qué desbloquea**: crear VPC/EKS/DocumentDB/NAT. **Riesgo si se crea sin tope**: EKS + DocumentDB +
NAT **no tienen free tier** (R2) y un olvido de apagado genera factura real.

### 6.4 Opcionales y diferidos

- **Diferido**: limpieza de credenciales — retirar la línea de `~/.zshenv`, borrar `.bak-20261014101412`
  y **revocar/regenerar el PAT al terminar la demo** (revocar ahora rompe el MCP).
- **Opcional**: `.gitignore` con `.DS_Store` (macOS puede regenerarlo).
- **Opcional**: `groupBy=Status` solo se puede fijar por UI (no verificable por API).
- **Ya corregido en esta guía**: las 2 referencias obsoletas al estado antiguo del repo (conteo de commits y de archivos ya actualizados a `dbe73f4` / 13 archivos).

---

## 7. Orden de trabajo del Bloque C

**Paso 1 · M1 (15 issues) — fundamentos y app base.** `/backend` `/frontend` `/infra` (`TVH-01`),
scaffold backend `/health` `/ready` (`TVH-04`), scaffold frontend Shaka (`TVH-05`), modelos Mongoose
(`TVH-29`), auth JWT (`TVH-30`), CRUD canales (`TVH-31`), importación M3U (`TVH-32`), usuarios/favoritos/
historial (`TVH-33`), pruebas con cobertura ≥80 % **junto al código** (`TVH-34`), tablero/milestones/
asignaciones (`TVH-14/15`).

**Paso 2 · M2 (23 issues) — infra y pipelines (cuello de botella).** Es la parte menos conocida del
curso. **Camino crítico**: `TVH-16` (Terraform VPC + remote state) → `17` (EKS) → `20` (LB Controller/
Ingress) → `23` (deploy backend) → `37/39` (gate Prod). **En paralelo**: `18` IAM/OIDC, `19` DocumentDB,
`26` Docker Hub, `27/28` Dockerfiles, `35/36` workflows backend, `38` frontend. **Validar pronto la
conexión a DocumentDB desde Dev** (R3: no se prueba desde la laptop).

**Paso 3 · M3 (4 issues) — observabilidad; no dejarla para el final.** `41` X-Ray/ADOT, `42` logs y
alarmas, `43` Container Insights + métricas ALB, `44` dashboard CPU/Mem/Request (R4: no se enseña en clase).

**Paso 4 · M4 (6 issues) — demo y cierre.** `45` ensayo completo + capturas de respaldo (R6), `46` reporte
con distribución de actividades, `47` presentación, `48` plan de apagado de costos.

**Camino crítico global**: `TVH-16→17→20→23→37/39→45→47`.

**Checklist de la demo en vivo**

- [ ] Cambio de código en una rama `feature/*`/`fix/*`
- [ ] PR con plantilla; **aprobación de la otra persona** (Autorizar el PR)
- [ ] Pipeline en **Dev**: ver resultado de **pruebas unitarias** y **proyecto publicado**
- [ ] **Aprobar pipeline a Prod**; ver el cambio en la **URL pública**
- [ ] **APM**: trazas, errores y mensajes
- [ ] **Métricas** CPU, Memoria, Request
- [ ] Capturas de respaldo listas (R6) y cada quien puede **explicar su código**

---

## 8. Riesgos

Detalle completo en [`wiki/07-riesgos.md`](wiki/07-riesgos.md) (R1–R8). Aquí se separan por origen.

### Heredados del curso / material (fuentes en conflicto)

- **Fuentes en conflicto**: la guía DOCX permite AWS/GitHub y nombra Prometheus/Grafana; S13 (rúbrica
  detallada) y la tarea de presentación mencionan Azure DevOps y Azure/Cloudflare.
- **APM, Terraform y métricas CPU/Mem/Request** son exigidos pero **no se enseñan** en el curso (R4).
- **"Tema libre"** no aparece en la guía DOCX (fue acuerdo de clase/Canvas).
- **Ponderación**: el proyecto vale **33.33 %** y exige **promedio ≥ 60**.

### Derivados de nuestras decisiones

- **R1 / R1b** — CloudWatch vs Azure/Cloudflare y CloudWatch/X-Ray vs Prometheus/Grafana: **desviación
  confirmada y justificada** por el profesor el **25 nov 2026** (§6.1). **Prometheus/Grafana descartado con
  autorización** (excepción justificada: no duplica instrumentación).
- **R2** — **sigue vigente**: coste real de **EKS + DocumentDB** (sin free tier); mitigar con **cuenta AWS
  con tope de gasto** y apagado (TVH-48). Es la **única validación externa pendiente**.
- **R3** — Compatibilidad **DocumentDB (~MongoDB 3.6/4.0) ↔ MongoDB 8 + Mongoose**: fijar versiones y
  validar en Dev antes de cerrar el stack (`TVH-29`).
- **R5** — Listas **M3U de terceros**: se usan **fixtures sintéticos**; no se copian los `.m3u` de `tv.hub`.
- **R6** — Demo en vivo dependiente de red: **capturas de respaldo** (`TVH-45`).
- **R7 / R8** — Cobertura 80 % e IA condicionada (`TVH-34`, `TVH-47`).
- **Matiz heredado no bloqueante**: `e46821e` (root) usó `urielpinag@outlook.com`, email no asociado →
  avatar genérico; no afecta a la autoría ni a la rúbrica.

---

## Anexo A · Mapa de cobertura (30 filas)

> **Cómo leerlo.** `✅ Documentado` = la documentación cubre el punto tal como se entrega hoy.
> `🟡 Planificado` = hay un issue que lo implementará, pero **aún no existe** código, Terraform,
> pipeline, Docker Hub real, APM, métricas, PRs ni ambientes Dev/Prod. `⚠️ Desviación confirmada por el profesor (25 nov 2026)` =
> cobertura documental válida con discrepancia frente a la rúbrica, **ya autorizada** por el profesor.
> `❌ Pendiente` = sin evidencia ni issue.

### A.1 Entregables (sección 2 de la rúbrica)

| # | Punto de la rúbrica | Evidencia (ruta / Wiki / issue / Project) | Estado | Justificación |
|---|---------------------|--------------------------------------------|--------|---------------|
| E-01 | Tarea "presentación del proyecto final" (previa) | Cronograma del curso (S1–S17), fuera del repo | ⚠️ Desviación confirmada (25 nov 2026) | Es un entregable de Canvas previo al proyecto; no deja artefacto en el repo. Debe **confirmarse** que la presentación de la fecha final cubre ambas tareas. |
| E-02 | Acceso a la plataforma (adaptado: GitHub) | Repo público `urielpinag/idc_proyecto` | ✅ Documentado | El repo es **público**, la evaluación puede verlo sin invitación. Persona B (`Zataaaa`) ya tiene permiso `write` y la invitación fue aceptada; los 48 issues están asignados 24/24. |
| E-03 | Backlog en los tableros | `docs/backlog.md`, Project #2, TVH-14 / TVH-15 | ✅ Documentado | Existen las 5 columnas (Backlog, Ready, In Progress, In Review, Done), 48 issues cargados y 48 items en el Project. Falta solo que el board agrupe por `Status` (configuración de UI, no de contenido). |
| E-04 | Wiki en Markdown: descripción del proyecto | `docs/wiki/01-descripcion.md`, Wiki, TVH-07 | ✅ Documentado | Problema, solución, alcance dentro/fuera, usuarios y distribución de actividades de 2 personas. |
| E-05 | Wiki: componentes y métodos (diagrama de clases) | `docs/wiki/02-componentes.md`, TVH-08 | ✅ Documentado | 6 entidades con campos y métodos, tabla de métodos clave, ~20 endpoints y `classDiagram` Mermaid válido. |
| E-06 | Wiki: Stack Tecnológico | `docs/wiki/03-stack.md`, TVH-09 | ✅ Documentado | Tabla por capa + justificación de las 6 decisiones cerradas y compatibilidad DocumentDB↔Mongoose. |
| E-07 | Wiki: recursos a crear (diagrama de infraestructura) | `docs/wiki/04-infraestructura.md`, TVH-10 | ✅ Documentado | Enumera VPC, subnets, EKS, node group, IAM/OIDC, ALB controller, DocumentDB, SG y CloudWatch, con `flowchart TB`. Los recursos **están diagramados, no creados**. |
| E-08 | Wiki: diagrama de deployment | `docs/wiki/05-deployment.md`, TVH-11 | ✅ Documentado | Flujo PR → Actions → Dev → aprobación → Prod → URL pública en `flowchart LR`. |
| E-09 | Repositorio de Infra con código Terraform | `docs/wiki/04-infraestructura.md` (diseño), issues TVH-16, TVH-17, TVH-18, TVH-19, TVH-20, TVH-22, TVH-40 | ⚠️ Desviación confirmada (25 nov 2026) | Hoy solo existe el **diseño** de la infraestructura; **no hay código Terraform** ni carpeta `infra/`. La rúbrica pide un "repositorio de Infra"; se resolvió como **monorepo `/infra`** (decisión cerrada #4) → desviación confirmada por el profesor el 25 nov 2026 y justificada en `docs/wiki/07-riesgos.md`. |
| E-10 | Backend con PRs y estrategia de ramas | `docs/wiki/06-estrategia-ramas.md`, `.github/pull_request_template.md`, TVH-01, TVH-02, TVH-03, TVH-04 | 🟡 Planificado | La estrategia y la plantilla de PR ya existen; **el backend y sus PRs aún no**. Lo implementan TVH-04 y los issues de E3b. |
| E-11 | Frontend con PRs y estrategia de ramas | `docs/wiki/06-estrategia-ramas.md`, TVH-05, TVH-38 | 🟡 Planificado | Igual que E-10: estrategia documentada, **frontend sin implementar**. |
| E-12 | Pipeline Backend: Build → Pruebas Unitarias | TVH-34, TVH-35 | 🟡 Planificado | Documentado en `05-deployment.md`; **no hay workflow** en `.github/workflows/`. |
| E-13 | Pipeline Backend: Ambiente Dev | TVH-36, TVH-23 | 🟡 Planificado | Deploy a namespace `dev` de EKS definido; sin entorno real ni URL pública. |
| E-14 | Pipeline Backend: Ambiente Prod | TVH-37, TVH-39 | 🟡 Planificado | Gate con `required reviewers` documentado; el Environment `prod` **no está creado**. |
| E-15 | Pipeline Frontend: Ambiente Dev | TVH-38, TVH-24 | 🟡 Planificado | Workflow de frontend y deploy a Dev planificados, sin ejecución. |
| E-16 | Pipeline Frontend: Ambiente Prod | TVH-39 | 🟡 Planificado | Reutiliza el gate de Prod del backend; depende de TVH-37. |
| E-17 | Docker Hub: Service connection | `03-stack.md`, `05-deployment.md`, TVH-26, TVH-27, TVH-28 | 🟡 Planificado | Definido el equivalente (**GitHub Secrets + rol IAM vía OIDC**) y los repos `tvhub-api`/`tvhub-web`; **no hay imágenes publicadas**. |
| E-18 | Portal Azure/CloudFlare: recursos creados (Backend, Frontend) | `04-infraestructura.md` (CloudWatch), R1, TVH-23, TVH-24 | ⚠️ Desviación confirmada (25 nov 2026) | Con AWS los recursos y métricas se muestran en **CloudWatch / consola AWS**. **R1 confirmado (25 nov 2026)**. |

### A.2 Criterios a evaluar en la presentación (sección 3)

| # | Punto de la rúbrica | Evidencia (ruta / Wiki / issue / Project) | Estado | Justificación |
|---|---------------------|--------------------------------------------|--------|---------------|
| C-01 | Descripción del proyecto | `docs/wiki/01-descripcion.md`, TVH-07, TVH-47 | ✅ Documentado | Hay descripción escrita; en la demo debe **explicarse en vivo** (TVH-47). |
| C-02 | Descripción de la tecnología | `docs/wiki/03-stack.md`, TVH-09, TVH-47 | ✅ Documentado | Stack y justificación completos; requiere explicación oral. |
| C-03 | Estrategia de ramas usadas | `docs/wiki/06-estrategia-ramas.md`, TVH-02, TVH-12 | ✅ Documentado | GitHub Flow documentado; `main` ya protegida con PR + 1 aprobación (25 nov 2026); faltan los PRs reales, que llegan con el Bloque C. |
| C-04 | Realizar un cambio en el código | TVH-45, TVH-47 | ❌ Pendiente | **No hay código** que cambiar todavía; se ejecuta en el ensayo de demo (M4). |
| C-05 | Autorizar el PR | `.github/pull_request_template.md`, TVH-02, TVH-45 | 🟡 Planificado | Existe la plantilla y la regla "nadie aprueba su propio PR"; **no hay PR real**. |
| C-06 | Pipeline en Dev: resultado de Pruebas Unitarias | TVH-34, TVH-35 (cobertura ≥80 % bloqueante, lcov + JUnit) | 🟡 Planificado | Suite y workflow planificados; **sin tests ejecutables** ni artefactos. |
| C-07 | Pipeline en Dev: proyecto publicado en Dev | TVH-36, TVH-23, TVH-20 | 🟡 Planificado | URL pública vía ALB documentada; **no existe ambiente Dev**. |
| C-08 | Aprobar pipeline a Prod: cambio visible en URL pública | TVH-37, TVH-39, TVH-20 | 🟡 Planificado | Gate de aprobación documentado; **sin Prod ni URL pública**. |
| C-09 | APM: Trazas, Errores, Mensajes | `03-stack.md`, `04-infraestructura.md`, TVH-41, TVH-42 | 🟡 Planificado | Instrumentación X-Ray/ADOT prevista; **no hay APM operando**. R1b/4 (no se enseña en el curso). |
| C-10 | Métricas CPU, Memoria, Request | `04-infraestructura.md`, TVH-21, TVH-43, TVH-44 | ⚠️ Desviación confirmada (25 nov 2026) | Container Insights + métricas ALB + dashboard planificados; **sin datos reales**. Mismo desvío R1 que E-18 ("portal de Azure o Cloudflare"). |

### A.3 Entregables (sección 4)

| # | Punto de la rúbrica | Evidencia (ruta / Wiki / issue / Project) | Estado | Justificación |
|---|---------------------|--------------------------------------------|--------|---------------|
| T-01 | Tarea de presentación del proyecto (entregada previamente) | Fuera del repo (Canvas) | ⚠️ Desviación confirmada (25 nov 2026) | Ver E-01: debe confirmarse cómo se computa. |
| T-02 | Proyecto en Azure DevOps o GitHub | Repo + Wiki + Project #2 | ✅ Documentado | El proyecto **está en GitHub** con repo, Wiki y tablero, que es la opción permitida por la rúbrica ("o GitHub"). |

**Leyenda:** **✅ 11 Documentado · 🟡 13 Planificado · ⚠️ 5 Desviación confirmada (25 nov 2026) · ❌ 1 Pendiente.**

> La fila `❌` (**C-04**, «realizar un cambio en el código») **sí tiene issues** (`TVH-45`/`TVH-47`): el
> `❌` significa «aún no hay código que cambiar», no «falta plan».
> **`TVH-46`** debe actualizar este mapa 🟡→✅ conforme se implemente cada punto.

---

## Anexo B · Dónde está cada cosa

| Contenido | Ubicación |
|---|---|
| Repositorio | https://github.com/urielpinag/idc_proyecto |
| Wiki publicada | https://github.com/urielpinag/idc_proyecto/wiki |
| Issues | https://github.com/urielpinag/idc_proyecto/issues |
| Tablero (Project #2) | https://github.com/users/urielpinag/projects/2 |
| Projects (lista) | https://github.com/urielpinag/idc_proyecto/projects |
| Fuentes de la Wiki | `docs/wiki/` (`README.md` + `01-descripcion.md` … `07-riesgos.md`) |
| Backlog | `docs/backlog.md` (columnas, épicas E1–E11 + E3b, milestones, labels) |
| Contrato de issues | `docs/issues.md` (48 issues TVH-01…TVH-48) |
| Propuesta | [`TV_Hub_Propuesta_Proyecto_Final.pdf`](TV_Hub_Propuesta_Proyecto_Final.pdf) |
| Plantilla de PR | `.github/pull_request_template.md` |

- Las 8 páginas de la Wiki: `Home.md` (índice) + `01` descripción, `02` componentes, `03` stack,
  `04` infraestructura, `05` deployment, `06` estrategia de ramas, `07` riesgos.
- La guía DOCX y las diapositivas S1–S17 son **material externo no versionado**.
- ⚠️ Existe un **Project #1 "DBaaS-Fleet"** preexistente de la propuesta descartada: **ignóralo**, todo el
  trabajo va en el **#2** "IDC Proyecto Final - TV Hub".

---

> Si encuentras una discrepancia, abre un issue o comenta en el PR. Editar `docs/wiki/*` obliga a
> **re-publicar la Wiki** (`idc_proyecto.wiki.git`) para evitar drift entre la fuente en `main` y lo publicado.
