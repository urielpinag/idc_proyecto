# Wiki — TV Hub (IDC · ESI3905O)

Wiki de planificación del proyecto integrador de **Infraestructura para el Desarrollo Continuo**.
Documenta la arquitectura, la infraestructura y el proceso de entrega de **TV Hub**: una aplicación web de
IPTV que se despliega en **AWS** con contenedores en **Amazon EKS** y base de datos **Amazon DocumentDB**,
usando un **monorepo** en **GitHub** con CI/CD en **GitHub Actions**.

> Estado: documentación de planificación. El código de aplicación (`/backend`, `/frontend`) y el código de
> El código (`/backend`, `/frontend`), Terraform (`/infra`) y los workflows de CI/CD ya están implementados en `main`.

## Índice

| # | Documento | Contenido |
|---|-----------|-----------|
| 01 | [Descripción del proyecto](01-descripcion.md) | Problema, alcance, usuarios, equipo y distribución de actividades |
| 02 | [Componentes](02-componentes.md) | Entidades, métodos y diagrama de clases |
| 03 | [Stack tecnológico](03-stack.md) | Tecnologías y justificación de GitHub, AWS, EKS y DocumentDB |
| 04 | [Infraestructura](04-infraestructura.md) | Recursos AWS a crear y diagrama de infraestructura |
| 05 | [Deployment y CI/CD](05-deployment.md) | Pipeline, ambientes Dev/Prod y diagrama de despliegue |
| 06 | [Estrategia de ramas](06-estrategia-ramas.md) | Ramas, PRs, protección de `main` y convención de commits |
| 07 | [Riesgos y pendientes de confirmar](07-riesgos.md) | Riesgos técnicos, costos y decisiones pendientes con el profesor |

Documentos de gestión del trabajo (fuera de la Wiki):

- [Backlog](../backlog.md) — columnas del tablero, épicas, milestones y labels.
- [Issues](../issues.md) — desglose de issues con criterios de aceptación y asignación.

## Diagramas

Los diagramas están escritos en **Mermaid** dentro de los documentos Markdown, de modo que GitHub los
renderiza sin herramientas adicionales:

1. **Diagrama de clases** → [`02-componentes.md`](02-componentes.md#diagrama-de-clases)
2. **Diagrama de infraestructura** → [`04-infraestructura.md`](04-infraestructura.md#diagrama-de-infraestructura)
3. **Diagrama de deployment / CI-CD** → [`05-deployment.md`](05-deployment.md#diagrama-de-deployment--ci-cd)

## Estructura del repositorio

```text
/
├── backend/      # API REST (TypeScript + Express) — Node 22
├── frontend/     # SPA HTML/CSS/JS + Shaka Player
├── infra/        # Terraform: VPC, EKS, DocumentDB, IAM, monitoreo
├── docs/         # Esta Wiki (Markdown) + backlog + issues
└── .github/      # Plantilla de PR y workflows de GitHub Actions
```

## Cómo publicar esta Wiki en GitHub

GitHub Wiki es un repositorio Git aparte (`<owner>/<repo>.wiki.git`). Los documentos de `docs/wiki/`
son la fuente; para publicarlos, una vez autorizado el repositorio:

1. En GitHub: **Settings → Features → Wikis** debe estar habilitado.
2. Clonar la wiki:
   ```bash
   git clone https://github.com/<owner>/<repo>.wiki.git
   ```
3. Copiar los documentos como páginas (`Home.md` equivale al índice):
   ```bash
   cp docs/wiki/README.md .wiki/Home.md
   cp docs/wiki/01-descripcion.md .wiki/01-descripcion.md
   # ... y así con el resto
   ```
4. Commit y push **del repositorio de la wiki** (no del monorepo):
   ```bash
   cd .wiki && git add Home.md 01-descripcion.md && git commit -m "docs: publicar wiki inicial"
   git push origin master
   ```
5. Alternativa sin clonar: **Wiki → New page** y pegar el contenido de cada `.md`. Si la vista de la
   Wiki no renderiza Mermaid, consultar los diagramas en el repositorio, donde GitHub sí los renderiza.

> Nota: publicar la Wiki requiere autorización explícita del usuario. Este repositorio solo contiene las
> fuentes en Markdown.
