# Guía de Presentación y Ciclo DevSecOps — TV Hub

Documento operativo con la explicación completa de los pipelines aplicados, el cumplimiento de la rúbrica, el runbook para volver a levantar la infraestructura antes de la exposición y el guion recomendado para presentar en vivo.

---

## 1. Ciclo DevSecOps y Pipelines Aplicados

El proyecto sigue **GitHub Flow** sobre el monorepo `urielpinag/idc_proyecto` (`/backend`, `/frontend`, `/infra`):

1. **Control de código y ramas (`TVH-02`, `TVH-03`)**:
   - Rama `main` protegida: requiere Pull Request, al menos 1 aprobación y check obligatorio `build-test`. Force-push y borrado bloqueados.
   - Simulación de 2 desarrolladores (`ur` / `urielpinag` y `Carlos Z` / `Zataaaa`) con 24/24 issues asignados y revisión independiente antes de cada merge.

2. **Integración Continua — Backend CI (`.github/workflows/backend-ci.yml`)**:
   - Se dispara en cada PR y push a `main` que toque `backend/**` (y manualmente vía `workflow_dispatch`).
   - Ejecuta `npm ci`, `npm run lint`, `npm run build` y `npm test` con Jest + `mongodb-memory-server`.
   - **Gate de calidad**: cobertura mínima **≥ 80 %** (verificado en **91.41 %** stmts) y publicación de reportes JUnit y `lcov`.

3. **Entrega Continua — Backend Deploy (`.github/workflows/backend-deploy.yml`)**:
   - Se dispara automáticamente al concluir con éxito `Backend CI` en `main` (`workflow_run`), condicionado a `vars.DEPLOY_ENABLED == 'true'`.
   - **Dev (`deploy-dev`)**: construye imagen multi-stage (`node:22-alpine`, usuario no-root `node`, certificado TLS `/app/certs/global-bundle.pem`), la publica en Docker Hub (`piniaops/tvhub-api:<sha>`), autentica en AWS mediante **OIDC** (`tvhub-ci-deploy`, sin access keys estáticas), actualiza kubeconfig de `tvhub-eks`, crea secrets en namespace `dev`, aplica `Deployment`/`Service`/`Ingress` y valida `/health` y `/ready` en el ALB de Dev.
   - **Prod (`deploy-prod`)**: depende de `deploy-dev` y `vars.PROD_DEPLOY_ENABLED == 'true'`. Queda pausado en el environment `prod` esperando **aprobación manual**. Al aprobarse, **reutiliza exactamente la misma imagen `<sha>`** (sin rebuild), transforma los manifiestos al namespace `prod` (ALB separado `tvhub-prod`) y valida `/health` y `/ready`.

4. **Entrega Continua — Frontend Deploy (`.github/workflows/frontend-deploy.yml`)**:
   - Corre `npm test` (44/44 pruebas en Node), construye y publica `piniaops/tvhub-web:<sha>`, despliega en `dev`, obtiene dinámicamente el hostname del ALB e inyecta `API_BASE_URL` en `/config.js`, y pasa al mismo gate manual de `prod` sin reconstruir la imagen.

5. **Infraestructura como Código — Terraform (`/infra`, `terraform.yml`)**:
   - Estado remoto en S3 (`tvhub-terraform-state-124125038724`) con bloqueo en DynamoDB (`tvhub-terraform-locks`).
   - Provisiona VPC (2 AZs, subnets públicas/privadas, NAT Gateway), EKS (`tvhub-eks`, 2 nodos), DocumentDB `5.0.0` privado (TLS obligatorio), IAM/OIDC, AWS Load Balancer Controller v3.7.0, `metrics-server`, log groups, alarma de errores y dashboard `tvhub-dev`.
   - *Nota*: el workflow `terraform.yml` valida formato y sintaxis (`fmt` + `validate`) en cada PR; `INFRA_PLAN_ENABLED` e `INFRA_APPLY_ENABLED` se mantienen desactivados porque el rol OIDC de CI está acotado a `eks:DescribeCluster` (principio de mínimo privilegio), ejecutando `apply`/`destroy` desde operador admin.

6. **Observabilidad (CloudWatch + X-Ray / ADOT)**:
   - Backend instrumentado con OpenTelemetry (`OTEL_TRACING_ENABLED=true`, exportando OTLP HTTP al puerto `4316` del `cloudwatch-agent` del addon `amazon-cloudwatch-observability`).
   - Trazas distribuidas en **AWS X-Ray** (`tvhub-api` + operaciones a DocumentDB), logs JSON en **CloudWatch Logs** (`/aws/containerinsights/tvhub-eks/application`), métricas de nodos/pods (`ContainerInsights`) y ALB (`AWS/ApplicationELB`) en el dashboard `tvhub-dev`, y alarma `tvhub-dev-errors`.

---

## 2. Cumplimiento Punto por Punto de la Rúbrica

- **§2 Entregables**:
  - Repo público en GitHub + acceso colaborador (`Zataaaa`) + 24/24 issues.
  - Tablero Project #2 con 5 columnas (`Backlog`, `Ready`, `In Progress`, `In Review`, `Done`).
  - Wiki de 8 páginas con descripción, clases (Mermaid), stack, infraestructura (Mermaid), deployment (Mermaid), ramas y riesgos.
  - Terraform completo en `/infra` + Backend y Frontend con PRs y GitHub Flow.
  - Pipelines: Backend CI (`build-test` ≥ 80 %), Backend Dev/Prod, Frontend Dev/Prod, Docker Hub (`piniaops/tvhub-api`, `piniaops/tvhub-web`) y OIDC.
- **§3 Presentación en vivo**:
  - Cambio en código → PR con plantilla → aprobación → `Backend/Frontend CI` → Dev automático → aprobación manual `prod` → cambio visible en URL pública de Prod (ensayado en `TVH-45`, PR `#92`, run `#45792907780`).
  - APM: trazas en X-Ray, logs JSON en CloudWatch, alarma y dashboard `tvhub-dev`.
- **§4 / S13**:
  - Reporte con distribución de actividades (`docs/revision-entrega.md`, `docs/evidencias/despliegue-2026-11.md`) y arquitectura CloudWatch + X-Ray/ADOT.

---


### Issues que quedan abiertos (fuera de alcance / decisión de seguridad)
- **`TVH-25` (HPA 2→5):** `metrics-server` está instalado en EKS, pero el manifiesto `HorizontalPodAutoscaler` y la prueba de carga quedan como mejora opcional.
- **`TVH-40` (`terraform plan/apply` en CI):** `terraform.yml` valida formato y sintaxis (`fmt` + `validate`) en cada PR; `INFRA_PLAN_ENABLED` e `INFRA_APPLY_ENABLED` se mantienen desactivados por principio de mínimo privilegio (el rol OIDC `tvhub-ci-deploy` solo tiene permisos para desplegar en EKS).

## 3. Cómo Volver a Levantar el Proyecto (y Apagarlo Después)

> **Tiempo estimado:** ~35–40 min antes de la exposición. El bucket S3 y la tabla DynamoDB del bootstrap ya existen y no cobran por hora.

### Paso A — Levantar infraestructura AWS (~25–30 min)
1. Autenticarse en AWS (cuenta `124125038724`):
   ```bash
   aws login
   eval "$(aws configure export-credentials --format env)"
   ```
   *(Importante: las credenciales exportadas caducan a los ~15 min; si `terraform apply` falla por `ExpiredToken`, vuelve a correr `eval "$(aws configure export-credentials --format env)"` y re-ejecuta `terraform apply`.)*
2. Ir a `infra/` desde un worktree limpio de `main`, cargar secretos locales (`~/.config/tvhub/secrets.env`) e inicializar:
   ```bash
   set -a && . ~/.config/tvhub/secrets.env && set +a
   terraform init -input=false \
     -backend-config="bucket=tvhub-terraform-state-124125038724" \
     -backend-config="key=tvhub/terraform.tfstate" \
     -backend-config="region=us-east-1" \
     -backend-config="dynamodb_table=tvhub-terraform-locks" \
     -backend-config="encrypt=true"
   terraform apply -input=false -auto-approve
   ```
3. Configurar `kubectl` (en este equipo usar **`/usr/local/bin/kubectl`**, ya que el de nix apunta a minikube) y activar Application Signals:
   ```bash
   aws eks update-kubeconfig --name tvhub-eks --region us-east-1
   /usr/local/bin/kubectl get nodes
   aws application-signals start-discovery --region us-east-1
   ```
4. **Actualizar `MONGODB_URI` en GitHub Secrets** (el endpoint de DocumentDB cambia si se recreó el clúster):
   ```bash
   DOCDB_EP=$(terraform output -raw docdb_endpoint)
   printf '%s' "mongodb://${TF_VAR_master_username}:${TF_VAR_master_password}@${DOCDB_EP}:27017/tvhub?tls=true&tlsCAFile=/app/certs/global-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false&authSource=admin" | gh secret set MONGODB_URI -R urielpinag/idc_proyecto
   ```

### Paso B — Desplegar Frontend y Backend (~10 min)
1. Disparar `Frontend Deploy Dev`: `gh workflow run "Frontend Deploy Dev" --ref main -R urielpinag/idc_proyecto` y aprobar el environment `prod` en GitHub Actions cuando termine Dev.
2. Disparar `Backend CI`: `gh workflow run "Backend CI" --ref main -R urielpinag/idc_proyecto` (al terminar, dispara `Backend Deploy Dev` automáticamente) y aprobar `prod`.
3. Obtener las URLs públicas:
   ```bash
   /usr/local/bin/kubectl -n dev get ingress
   /usr/local/bin/kubectl -n prod get ingress
   ```

### Paso C — Apagar todo al terminar la demo (0 costos por hora)
```bash
/usr/local/bin/kubectl delete ingress --all -n dev --ignore-not-found
/usr/local/bin/kubectl delete ingress --all -n prod --ignore-not-found
# Esperar ~1 min a que se borren los 2 ALB, luego:
eval "$(aws configure export-credentials --format env)"
terraform destroy -input=false -auto-approve
```

---

## 4. Guion Recomendado para Presentar en Vivo

1. **Arquitectura y Gestión (3 min)**: mostrar el repo en GitHub, `docs/wiki/` (diagramas de clases, infra y deployment) y el **Project #2** con las 5 columnas y los issues repartidos 24/24.
2. **Infraestructura como Código (2 min)**: mostrar `/infra` (módulos VPC, EKS, DocumentDB 5.0, IAM/OIDC, CloudWatch) y la consola de AWS (EKS `tvhub-eks` con 2 nodos y DocumentDB).
3. **Demo en vivo — Cambio → PR → Dev → Prod (5 min)**:
   - Editar un texto pequeño en `frontend/index.html` (ej. cambiar `v1.1` → `v1.2`) en una rama `feature/*`.
   - Abrir PR con la plantilla, mostrar el check `build-test` / pruebas y aprobar el PR.
   - Mergear a `main`: enseñar en **GitHub Actions** cómo corre `test` → construye imagen en `piniaops/tvhub-web` → despliega en **Dev** automáticamente → se detiene en `prod` pidiendo aprobación manual.
   - Mostrar el cambio ya visible en la **URL de Dev**, aprobar el job `prod` en vivo, y refrescar la **URL de Prod** para demostrar el cambio publicado.
4. **Observabilidad (3 min)**:
   - Abrir **AWS X-Ray** (trazas de `tvhub-api` y consultas a DocumentDB), **CloudWatch Logs** (`/aws/containerinsights/tvhub-eks/application`), la alarma `tvhub-dev-errors` y el dashboard **`tvhub-dev`** (CPU/memoria de nodos y pods + requests 4xx/5xx del ALB).
