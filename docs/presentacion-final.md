# Presentación Final — TV Hub (ESI3905O O2026)

Guía ejecutiva de la demo en vivo. El detalle técnico completo de pipelines, cumplimiento de rúbrica y runbook de encendido/apagado está en [`docs/guia-presentacion-y-devops.md`](./guia-presentacion-y-devops.md).

## Agenda de Demo (10–13 min)

1. **Contexto y Gestión**: repo `urielpinag/idc_proyecto`, Wiki (8 páginas + 3 diagramas Mermaid) y tablero Project #2 (24/24 entre `urielpinag` y `Zataaaa`).
2. **Infraestructura AWS (Terraform)**: VPC, EKS `tvhub-eks` (2 nodos), DocumentDB `5.0.0` (TLS), IAM/OIDC sin llaves estáticas, ALB Controller y CloudWatch/X-Ray.
3. **Ciclo DevSecOps en vivo**: cambio en `frontend/index.html` → PR con plantilla y revisión → merge a `main` → Docker Hub (`piniaops`) → Dev automático → aprobación manual `prod` → verificación en URL pública de Prod.
4. **Observabilidad**: trazas en AWS X-Ray (`tvhub-api`), logs JSON en `/aws/containerinsights/tvhub-eks/application`, alarma `tvhub-dev-errors` y dashboard `tvhub-dev`.
