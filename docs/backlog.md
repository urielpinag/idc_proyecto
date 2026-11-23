# Backlog — TV Hub

Backlog de planificación del proyecto integrador (IDC · ESI3905O). Se gestiona en **GitHub Projects**
(vista **Board**), con **labels**, **milestones** y **issues** enlazados. El contrato de cada issue está en
[`issues.md`](issues.md).

## Objetivo

Entregar TV Hub desplegado en **AWS (EKS + DocumentDB)** como **monorepo** en **GitHub**, con **Terraform** en
`/infra`, pipelines en **GitHub Actions** para **Dev** y **Prod**, observabilidad (trazas, errores, logs,
métricas) y una **estrategia de ramas** con PRs revisados. El backlog cubre 1:1 los entregables de la
rúbrica del curso.

## Tablero (columnas)

| Columna | Significado |
|---------|-------------|
| **Backlog** | Issue creado, priorizado, sin iniciar |
| **Ready** | Criterios claros y asignado, listo para trabajar |
| **In Progress** | En desarrollo por el asignado |
| **In Review** | PR abierto esperando revisión / pipeline en Dev |
| **Done** | Mergeado a `main`, Dev verificado y, si aplica, Prod aprobado |

## Flujo

`Backlog → Ready → In Progress → In Review → Done`

- Un issue pasa a **In Review** cuando su PR se abre y el pipeline corre en **Dev**.
- Pasa a **Done** tras el merge y la verificación en Dev (o Prod si corresponde).
- Nadie aprueba su propio PR (ver [`wiki/06-estrategia-ramas.md`](wiki/06-estrategia-ramas.md)).

## Épicas (1:1 con la rúbrica)

| ID | Épica | Entregable de la rúbrica | Milestone |
|----|-------|--------------------------|-----------|
| **E1** | Repositorio y estrategia de ramas | Backend/Frontend con PRs y estrategia de ramas; monorepo GitHub | M1 |
| **E2** | Wiki del proyecto (Markdown) | Wiki en archivo MD | M1 |
| **E3** | Backlog en tablero | Backlog en tablero (GitHub Projects) | M1 |
| **E3b** | API base (scaffold y entidades) | Soporte técnico: app REST compilable sobre DocumentDB (no es entregable de la rúbrica) | M1 |
| **E4** | Terraform / Repositorio de Infra | Repositorio de Infra con código de Terraform | M2 |
| **E5** | Recursos creados para Backend y Frontend | Recursos creados para Backend y Frontend | M2 |
| **E6** | Pipeline Backend | Build + pruebas unitarias, Ambiente Dev, Ambiente Prod | M2–M4 |
| **E7** | Pipeline Frontend | Ambiente Dev, Ambiente Prod | M2–M4 |
| **E8** | Docker Hub | Docker Hub + credenciales (service connection) | M2 |
| **E9** | APM (trazas, errores, mensajes) | APM: trazas, errores, mensajes | M3 |
| **E10** | Métricas CPU / Memoria / Request | Métricas CPU / Memoria / Request | M3 |
| **E11** | Demo en vivo y reporte final | Cambio en código → PR → autorizar → pipeline Dev → aprobar → Prod → URL pública; reporte y distribución de actividades | M4 |

> **E3b no es entregable:** es la aplicación TV Hub en sí, necesaria para poder desplegarla y monitorearla.
> Las otras 11 épicas cubren **1:1** los entregables de la rúbrica.
>
> **Orden sugerido:** E1–E3 (base), E3b (scaffold de la app), E4–E8 (infraestructura y entrega), E9–E10 (observabilidad),
> E11 (demo). Los issues de cada épica están en [`issues.md`](issues.md).

## Milestones (sprints)

| Milestone | Foco | Épicas |
|-----------|------|--------|
| **M1 — Fundamentos** | Repo, ramas, PRs, Wiki, backlog, app base | E1, E2, E3, E3b |
| **M2 — Infraestructura y entrega** | Terraform, EKS, DocumentDB, Docker Hub, pipelines base | E4, E5, E6, E7, E8 |
| **M3 — Observabilidad** | APM y métricas | E9, E10 |
| **M4 — Demo y cierre** | Ensayo completo de la demo, reporte final | E11 |

## Leyenda de labels

### Tipo

- `epic` — épica (agrupa issues)
- `app-base` — scaffold/entidades de la aplicación (soporte, no entregable de la rúbrica)
- `feature` — funcionalidad
- `infra` — Terraform, Kubernetes, manifests
- `ci-cd` — GitHub Actions, pipelines
- `observability` — APM, métricas, logs
- `docs` — documentación / Wiki
- `testing` — pruebas y cobertura

### Área

- `backend` — `/backend`
- `frontend` — `/frontend`
- `platform` — `/infra`, pipelines, ambientes

### Estado / prioridad

- `blocked` — depende de otro issue abierto
- `p0` — bloqueante para la demo
- `p1` — importante
- `p2` — deseable

## Equipo

- **Persona A** y **Persona B** (equipo de 2). Asignación por issue en [`issues.md`](issues.md).
- La distribución por área y la rotación de revisión están en
  [`wiki/01-descripcion.md`](wiki/01-descripcion.md).

## Restricciones del curso

- Se permite **IA** siempre que se conserven las tecnologías vistas en clase y el equipo pueda explicar el
  código.
- Se exigen Docker/Kubernetes/Terraform/pipelines YAML/Prometheus-Grafana/GitHub; el proyecto pesa
  **33.33%** y requiere promedio **≥ 60**.
- El reporte final incluye descripción, arquitectura, **distribución de actividades**, conclusiones y
  mejoras pendientes.
