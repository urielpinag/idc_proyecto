# 06 · Estrategia de ramas

## Modelo: GitHub Flow simplificado

Equipo de **2 personas** con un **monorepo** y despliegue continuo. Se usa un flujo simple y explícito:
`main` protegida, ramas cortas por cambio, Pull Request con revisión y merge. La idea es que cada cambio
que llega a `main` pueda desplegarse a **Dev** de inmediato y, tras aprobación, a **Prod**.

## Ramas

| Rama | Propósito | Nomenclatura | Ejemplo |
|------|-----------|--------------|---------|
| `main` | Rama estable y protegida; desplegable a Dev | — | `main` |
| `feature/*` | Funcionalidad nueva de backend o frontend | `feature/<issue>-<descripcion>` | `feature/12-favoritos` |
| `fix/*` | Corrección de errores | `fix/<issue>-<descripcion>` | `fix/31-refresh-token` |
| `infra/*` | Cambios de Terraform, pipelines y manifiestos | `infra/<issue>-<descripcion>` | `infra/8-eks-cluster` |

Convenciones:

- Nombres en **minúsculas**, con guiones, e incluyen el **número de issue** cuando exista.
- Ramas **cortas** (1–3 días de vida); se actualizan contra `main` con rebase/merge local.
- No se trabaja directamente sobre `main`.

## Protección de `main`

Reglas en **Settings → Branches → main**:

- **Pull Request obligatorio** antes de integrar (sin push directo).
- **Al menos 1 aprobación** de la otra persona (nadie aprueba su propio PR).
- **Checks de CI obligatorios** en verde: build, **pruebas unitarias** y **cobertura ≥ 80%**.
- **Conversaciones resueltas** antes del merge.
- Prohibido el **force-push** y el **borrado** de la rama.

## Ciclo de un cambio

1. Crear la rama desde `main` (`git switch -c feature/12-favoritos`).
2. Desarrollar con commits pequeños y mensaje claro.
3. Abrir **PR** con [`../.github/pull_request_template.md`](../../.github/pull_request_template.md),
   describiendo el cambio y los criterios de aceptación.
4. Se ejecuta el pipeline: build + pruebas + cobertura + imagen → **Dev**.
5. La otra persona **revisa y aprueba**.
6. Merge a `main` (squash) → se elimina la rama.
7. Para **Prod**: aprobación manual del Environment `prod`.

## Convención de commits

Se usa **Conventional Commits**:

| Tipo | Uso |
|------|-----|
| `feat:` | Nueva funcionalidad |
| `fix:` | Corrección de error |
| `docs:` | Documentación / Wiki |
| `test:` | Pruebas |
| `infra:` | Terraform, workflows, manifiestos |
| `chore:` | Tareas de mantenimiento |

Ejemplo: `feat(channels): agregar búsqueda por país y categoría`.

## Nota comparativa con GitFlow (propuesta original)

La propuesta de **TV Hub** planteaba un **"GitFlow simplificado"** con ramas `main`, `develop`,
`feature/<issue>-<desc>` y `hotfix/<desc>` (10 · Plan, p. 12). Se **simplifica aún más** a GitHub Flow con
`main`, `feature/*`, `fix/*` e `infra/*` porque:

- **Equipo de 2 personas**: mantener `develop` duplica merges y añade un salto extra entre `feature` y
  `main`.
- **Despliegue continuo**: `main` ya se despliega a Dev en cada merge; una rama de integración intermedia no
  aporta valor.
- **Menos ramas = menos conflictos y menos confusión** en la presentación final.
- Se conserva lo esencial del GitFlow de TV Hub: **revisión por PR**, `feature/*` ligada a un issue
  (`Closes #N`), conventional commits y tags de versión en `main`.

GitFlow completo (`release/*` prolongadas) tendría sentido con muchos desarrolladores y versiones en
paralelo, escenario que no aplica aquí.

> Detalle del PDF (p. 12) que difiere: el GitFlow de TV Hub nombraba `hotfix/<desc>` partiendo de `main`;
> aquí el equivalente es `fix/<issue>-<desc>` partiendo de `main`, para unificar el prefijo de correcciones.
