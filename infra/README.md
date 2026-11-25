# `infra/` — Infraestructura como código

Carpeta de la **infraestructura de TV Hub definida con Terraform**.

## Propósito

Aquí vivirá el código que provisiona y mantiene la infraestructura del proyecto en **AWS**, sin crear recursos
a mano: la red (VPC, subnets públicas y privadas, NAT Gateway), el clúster **Amazon EKS** con su node group y
addons, el clúster **Amazon DocumentDB** en subnets privadas y los roles **IAM** que usan los nodos y
**GitHub Actions vía OIDC**. También incluirá los manifiestos de Kubernetes (*Deployments*, *Services*,
*Ingress*, **HPA**, *Secrets*) que se aplican al clúster.

No se define aquí la observabilidad en Prometheus/Grafana: el monitoreo se resuelve con **CloudWatch +
X-Ray/ADOT** (decisión autorizada, ver `docs/wiki/03-stack.md`).

## Estado actual

**Carpeta vacía a propósito.** Todavía no hay ficheros `.tf` ni manifiestos: llegarán con los issues de la
épica de infraestructura. Este README solo documenta qué se va a construir aquí.

## Convenciones

- Terraform se formatea con `terraform fmt` antes de cada PR.
- El estado remoto y los archivos `*.tfstate` **no** se versionan (ver `.gitignore`); el lock file
  `.terraform.lock.hcl` **sí** debe versionarse.
- Ningún secreto ni cadena de conexión se guarda en el repositorio.
