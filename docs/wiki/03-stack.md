# 03 · Stack tecnológico

## Resumen

| Capa | Tecnología | Motivo |
|------|------------|--------|
| Lenguaje backend | **TypeScript (strict) / Node 22** | Tipado estricto, mismo lenguaje en todo el repo |
| Framework backend | **Express 5** | REST ligero, amplia documentación, visto en clase |
| Base de datos | **Amazon DocumentDB** (compatible MongoDB) | Servicio gestionado, backups, fuera del clúster |
| ODM | **Mongoose** | Modelos por componente (MVC), validación de esquemas |
| Autenticación | **JWT + refresh rotativo + bcryptjs** | Sesiones revocables, contraseñas con hash |
| Frontend | **HTML/CSS/JS vanilla + Shaka Player** | Sin build pesado; reproducción **HLS** en navegador |
| Pruebas | **Jest + Supertest + mongodb-memory-server** | Unitarias e integración de API; cobertura ≥ 80% |
| Contenedores | **Docker multi-stage** → **Docker Hub** | Imágenes reproducibles; EKS no requiere ECR |
| Orquestación | **Amazon EKS** (Kubernetes) | Escalado, Ingress NGINX + ALB, HPA |
| Infra como código | **Terraform** (`/infra`) | Provisiona VPC, EKS, DocumentDB, IAM, monitoreo |
| CI/CD | **GitHub Actions** | Ambientes `dev`/`prod` con aprobación manual |
| Observabilidad | **AWS X-Ray / ADOT + CloudWatch** | Trazas, errores, logs y métricas CPU/memoria/requests |
| Repositorio | **GitHub (monorepo)** | Un solo repo con `/backend`, `/frontend`, `/infra` |

## Decisiones cerradas y su justificación

### 1. GitHub (no Azure DevOps)

- El código, los issues, la Wiki, el **GitHub Projects** (backlog en tablero) y los **pipelines** viven en una
  sola plataforma.
- **GitHub Actions** es gratuito para repositorios públicos/privados de estudiante y se integra nativo con
  PRs, revisiones y *environments* con *required reviewers* (aprobación a Prod).
- El equivalente al *service connection* de Azure DevOps se resuelve con **roles IAM asumibles vía OIDC**
  desde GitHub Actions + **GitHub Secrets**.

### 2. Monorepo (`/backend`, `/frontend`, `/infra`)

- Un solo repositorio simplifica la revisión cruzada y el versionado conjunto de app + infraestructura.
- El pipeline usa **filtros por ruta** (`paths:`) para ejecutar solo lo que cambió.
- Mantiene alineados el código y su Terraform (un PR puede incluir la app y el cambio de infraestructura).

### 3. AWS

- La guía del curso permite **"AWS, Microsoft Azure u otro"**.
- Ofrece servicios gestionados maduros para cada necesidad: EKS, DocumentDB, ALB, CloudWatch, X-Ray.
- Se evita Cloudflare porque no cubre cómputo/orquestación ni base de datos.

### 4. Amazon EKS (Kubernetes) en lugar de ECS Fargate

- El curso enseña **Kubernetes** (manifiestos, Deployments, Services, Ingress, HPA, probes): EKS permite
  aplicar esos conceptos directamente.
- **Ingress NGINX + AWS Load Balancer Controller** exponen una **URL pública** vía ALB.
- **metrics-server + HPA** escalan de 2 a 5 réplicas con CPU > 70%.
- Frente a ECS Fargate, EKS conserva el vocabulario y las herramientas de Kubernetes del curso.

### 5. Amazon DocumentDB en lugar de MongoDB en StatefulSet

- La propuesta original
  ([`../TV_Hub_Propuesta_Proyecto_Final.pdf`](../TV_Hub_Propuesta_Proyecto_Final.pdf)) montaba **MongoDB en un
  StatefulSet de minikube**; para el despliegue en la nube se
  usa un servicio gestionado: **backups, alta disponibilidad y parches** sin operar un StatefulSet.
- DocumentDB se mantiene **fuera del clúster**, con un **Security Group** que solo acepta tráfico desde los
  nodos de EKS y credenciales en **Kubernetes Secrets**.

> **Alternativa considerada:** MongoDB Atlas (SaaS). Se descartó para mantener el despliegue dentro de una
> única nube y practicar el modelado de red (VPC + subnets + Security Groups) de AWS.

### 6. Docker Hub (no Amazon ECR)

- La propuesta original
  ([`../TV_Hub_Propuesta_Proyecto_Final.pdf`](../TV_Hub_Propuesta_Proyecto_Final.pdf)) ya publicaba en Docker Hub
  (`carloszatarain/tvhub-api`); se conserva.
- Las credenciales del usuario de Docker Hub se guardan como **GitHub Secrets** y EKS descarga las imágenes
  mediante `imagePullSecrets`.

## Compatibilidad DocumentDB ↔ Mongoose (importante)

DocumentDB **imita** la API de MongoDB, pero está certificada para versiones antiguas (**~3.6 / 4.0** de la
API de MongoDB), mientras que la propuesta
([`../TV_Hub_Propuesta_Proyecto_Final.pdf`](../TV_Hub_Propuesta_Proyecto_Final.pdf)) usa **MongoDB 8 + Mongoose**.

- **Riesgo:** operadores, índices, transacciones o agregaciones introducidas en MongoDB 5/6/7 no están
  soportadas; la versión del driver también es sensible a DocumentDB.
- **Acción:** fijar la versión del driver (`mongodb`) y de Mongoose a la compatible con DocumentDB,
  evitar operadores fuera de 4.0, y **validar conectividad + CRUD + sincronización M3U** en Dev antes de
  fijar el stack.
- Los **tests** siguen usando `mongodb-memory-server` (MongoDB real en memoria), por lo que una prueba
  contra DocumentDB debe ejecutarse además en el ambiente Dev.

## Pruebas y cobertura

- **Jest + Supertest**: unitarias de controladores/servicios e integración de endpoints.
- `mongodb-memory-server` para aislar la BD en los tests.
- Cobertura mínima **80% BLOQUEANTE** en el pipeline; se publican **lcov** y **JUnit** como artefactos en
  cada push y PR.

## Restricciones del curso

- Se permite **IA** siempre que se conserven las tecnologías vistas en clase y el equipo **pueda explicar el
  código**.
- Las tecnologías de referencia son Docker, Kubernetes, Terraform, pipelines YAML, Prometheus/Grafana y
  GitHub; AWS con CloudWatch cubre el monitoreo exigido.
