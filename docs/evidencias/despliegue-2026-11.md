# Evidencias de Despliegue y Observabilidad — TV Hub (26 nov 2026)

Registro verificado en la cuenta AWS `124125038724` (`us-east-1`), Docker Hub (`piniaops`) y GitHub Actions (`urielpinag/idc_proyecto`). No incluye secretos ni credenciales.

## 1. Infraestructura AWS (Terraform)

- **Backend remoto**: bucket S3 `tvhub-terraform-state-124125038724` + tabla DynamoDB `tvhub-terraform-locks`.
- **VPC y Red**: `vpc-0ec3d515c53edfcb3`, subnets públicas (`subnet-0ce2276e250aa1740`, `subnet-018199b3b67169665`), subnets privadas (`subnet-063a633e28eb1e963`, `subnet-05e4ff687cf03dea5`), NAT Gateway `nat-0d1a8351549de9211`.
- **EKS**: clúster `tvhub-eks`, node group `tvhub-eks-nodes` con 2 nodos `Ready` (`v1.37.1-eks-9adbfea`), AWS Load Balancer Controller v3.7.0 (`2/2` replicas), addon `amazon-cloudwatch-observability` (`ACTIVE`, con `cloudwatch-agent` y `fluent-bit`).
- **DocumentDB**: clúster `tvhub-docdb` en `engine_version = 5.0.0` (TLS obligatorio con `/app/certs/global-bundle.pem`, acceso restringido por Security Group desde los nodos EKS).
- **IAM y OIDC**: proveedor OIDC `token.actions.githubusercontent.com` con `immutable subject` del repositorio y rol `arn:aws:iam::124125038724:role/tvhub-ci-deploy`.

## 2. Docker Hub y Pipelines CI/CD

- **Imágenes publicadas**:
  - `piniaops/tvhub-api` (actualizada `2026-11-26T09:25:52Z`)
  - `piniaops/tvhub-web` (actualizada `2026-11-26T08:50:51Z`)
- **Runs verificados**:
  - `Backend CI` (`#45791660732`): `build-test` en verde, cobertura **91.41 %** stmts (≥ 80 % requerido), artefactos JUnit y `lcov`.
  - `Backend Deploy Dev` (`#45791767937`): `deploy-dev` en verde → aprobación manual en environment `prod` → `deploy-prod` en verde (sin rebuild).
  - `Frontend Deploy Dev` (`#45786560449`): `test` (44/44) → `deploy` (Dev) → aprobación manual `prod` → `deploy-prod` en verde.
  - **Ensayo de demo (`TVH-45`)**: PR `#92` (`TV Hub · v1.1 · ensayo de demo`) → `Frontend Deploy Dev` (`#45792907780`) → verificado en Dev y tras aprobación en Prod.

## 3. Endpoints Verificados (`200 OK`)

- **Dev ALB**: `http://k8s-tvhub-44a51f9f0a-1539449745.us-east-1.elb.amazonaws.com`
  - `/health` → `200`, `/ready` → `200` (conexión TLS a DocumentDB 5.0), `/` → `200`, `/config.js` → `200`, `/api/channels` → `200`.
- **Prod ALB**: `http://k8s-tvhubprod-2e21c638ca-741004107.us-east-1.elb.amazonaws.com`
  - `/health` → `200`, `/ready` → `200`, `/` → `200` (con `TV Hub · v1.1 · ensayo de demo`), `/config.js` → `200`, `/api/channels` → `200`.

## 4. Observabilidad (X-Ray + CloudWatch)

- **AWS X-Ray**: `174` trazas capturadas en ventana de 20 min, incluyendo servicio `tvhub-api` (HTTP `200`) y llamadas `ping cmd` / `tls.connect` hacia DocumentDB.
- **CloudWatch Logs**: `/aws/containerinsights/tvhub-eks/application` recibiendo logs JSON estructurados del backend (`"API escuchando en el puerto 3000"`, errores con `level: "error"`).
- **Métricas**: `ContainerInsights` (`node_cpu_utilization`, `node_memory_utilization`) y `AWS/ApplicationELB` (`RequestCount`) activos para ambos ALBs.
- **Alarma y Dashboard**: `tvhub-dev-errors` (`OK`) y dashboard `tvhub-dev` creados con expresiones `SEARCH(...)`.

## 5. Distribución de Actividades (24 / 24 issues asignados)

- **Persona A (`ur` / `urielpinag`) — 24 issues asignados**: `TVH-01`, `TVH-04`, `TVH-06`, `TVH-08`, `TVH-10`, `TVH-12`, `TVH-14`, `TVH-16`, `TVH-17`, `TVH-20`, `TVH-22`, `TVH-23`, `TVH-25`, `TVH-27`, `TVH-29`, `TVH-31`, `TVH-33`, `TVH-35`, `TVH-37`, `TVH-39`, `TVH-41`, `TVH-44`, `TVH-45`, `TVH-47`.
- **Persona B (`Carlos Z` / `Zataaaa`) — 24 issues asignados**: `TVH-02`, `TVH-03`, `TVH-05`, `TVH-07`, `TVH-09`, `TVH-11`, `TVH-13`, `TVH-15`, `TVH-18`, `TVH-19`, `TVH-21`, `TVH-24`, `TVH-26`, `TVH-28`, `TVH-30`, `TVH-32`, `TVH-34`, `TVH-36`, `TVH-38`, `TVH-40`, `TVH-42`, `TVH-43`, `TVH-46`, `TVH-48`.
