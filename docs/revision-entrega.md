# Proyecto Final TV Hub — Estado de Entrega (ESI3905O O2026)

Guía ejecutiva del proyecto **TV Hub** (aplicación IPTV con login JWT, catálogo filtrable, reproducción HLS con Shaka Player, favoritos, historial e importación M3U).

- **Repositorio:** `urielpinag/idc_proyecto` (monorepo `/backend`, `/frontend`, `/infra`, GitHub Flow).
- **Plataforma:** GitHub (Actions, Projects #2, Wiki) · **AWS** (`us-east-1`, EKS `tvhub-eks`, DocumentDB `5.0.0`, ALB HTTP:80, CloudWatch + X-Ray/ADOT) · **Docker Hub** (`piniaops/tvhub-api`, `piniaops/tvhub-web`).
- **Estado de issues:** **46 cerrados / 2 abiertos** de 48 totales (`TVH-25` HPA opcional y `TVH-40` `terraform plan/apply` en CI desactivado; `apply`/`destroy` ejecutados por el operador).

## Resumen de Cumplimiento

| Bloque | Evidencia principal | Estado |
|---|---|---|
| **Backlog y Tablero** | Project #2 (5 columnas) · `docs/backlog.md` · 24/24 asignados | ✅ Cumplido |
| **Wiki (8 páginas)** | `docs/wiki/` y GitHub Wiki (descripción, clases, stack, infra, deployment, ramas, riesgos) | ✅ Cumplido |
| **Terraform IaC** | `/infra` (VPC, EKS, DocumentDB 5.0, IAM/OIDC, ALB Controller, CloudWatch) | ✅ Cumplido |
| **CI Backend** | `.github/workflows/backend-ci.yml` (`lint` + `build` + `test` ≥ 80 % cobertura, JUnit/lcov) | ✅ Cumplido |
| **CI/CD Frontend y Backend** | `backend-deploy.yml` y `frontend-deploy.yml` (Docker Hub `piniaops` → Dev → aprobación manual `prod` sin rebuild) | ✅ Cumplido |
| **Observabilidad (APM/Logs/Métricas)** | OpenTelemetry → AWS X-Ray (`tvhub-api`), CloudWatch Logs (`/aws/containerinsights/tvhub-eks/application`), alarma `tvhub-dev-errors`, dashboard `tvhub-dev` | ✅ Cumplido |
| **Ensayo de Demo** | PR `#92` (`TVH-45`), run `#45792907780` verificado en Dev y Prod | ✅ Cumplido |
| **Evidencias de Despliegue** | [`docs/evidencias/despliegue-2026-11.md`](./evidencias/despliegue-2026-11.md) | ✅ Cumplido |
| **HPA 2→5** | `metrics-server` instalado; manifiesto HPA pendiente (`TVH-25`) | 🟡 Abierto |
| **Terraform plan/apply en CI** | `fmt` y `validate` activos en PR; `INFRA_PLAN_ENABLED`/`INFRA_APPLY_ENABLED` desactivados (`TVH-40`) | 🟡 Abierto |
