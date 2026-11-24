# 01 · Descripción del proyecto

## Problema

La propuesta original de **TV Hub** ([`../TV_Hub_Propuesta_Proyecto_Final.pdf`](../TV_Hub_Propuesta_Proyecto_Final.pdf))
parte de una necesidad cotidiana: muchas personas consumen canales de
televisión por internet (IPTV) mediante listas **M3U** sueltas, que se desordenan, duplican canales y
dependen de enlaces que cambian o dejan de funcionar. No existe un lugar único para buscar canales por
**nombre, país o categoría**, marcar **favoritos**, retomar la **reproducción** donde se dejó ni llevar un
**historial** de lo visto.

Además, para el curso el reto real es el **despliegue continuo**: la aplicación es el vehículo para
demostrar contenedores, orquestación, infraestructura como código, pipelines, ambientes y monitoreo.

## Solución

**TV Hub** es una aplicación web de IPTV compuesta por:

- **Área de usuario:** registro/login, búsqueda de canales (nombre/país/categoría), reproducción HLS en el
  navegador, favoritos e historial.
- **Área de administrador:** importar listas M3U, CRUD de canales y usuarios, y re-sincronización de
  listas **sin duplicados**.

La aplicación se empaqueta en contenedores, se despliega en **Amazon EKS** y usa **Amazon DocumentDB**
(compatible con MongoDB) como base de datos. Toda la infraestructura se define en **Terraform** y se
automatiza con **GitHub Actions** en dos ambientes (**Dev** y **Prod**) con aprobación manual a producción.

## Alcance

### Dentro del alcance

- API REST con autenticación JWT + refresh rotativo y ~20 endpoints sobre 6 entidades CRUD.
- Frontend web con reproducción HLS (Shaka Player).
- Monorepo `/backend`, `/frontend`, `/infra` con estrategia de ramas y PRs.
- Infraestructura AWS en Terraform: VPC, EKS, DocumentDB, Ingress/ALB, IAM/OIDC, monitoreo.
- Pipelines de CI/CD para backend y frontend, con ambiente Dev y Prod.
- Observabilidad: trazabilidad (APM), logs y métricas de CPU, memoria y requests.
- Pruebas unitarias con cobertura mínima **80% (bloqueante)**.

### Fuera del alcance

- Aplicaciones móviles nativas o de Smart TV.
- Transcodificación de video o servicio de streaming propio.
- Facturación, suscripciones o contenido protegido por DRM.
- Catálogo de canales propio: se consumen listas M3U de terceros provistas para prueba.

## Usuarios

| Perfil | Necesidades principales |
|--------|-------------------------|
| **Usuario final** | Registrarse, buscar canales, reproducir, guardar favoritos y consultar historial |
| **Administrador** | Importar/sincronizar listas M3U, administrar canales y usuarios |
| **Equipo de desarrollo (operador)** | Desplegar, monitorear y aprobar cambios entre ambientes |
| **Profesor / evaluador** | Ver el flujo completo: cambio → PR → pipeline Dev → aprobación → Prod → métricas |

## Equipo y distribución de actividades

Equipo de **2 personas**. La asignación por issue es explícita (**Persona A / Persona B**) en
[`../issues.md`](../issues.md); el reparto por área es el siguiente.

| Área de trabajo | Persona A | Persona B |
|-----------------|-----------|-----------|
| Backend (API, auth, entidades, pruebas) | Autor principal | Revisor / pruebas de integración |
| Frontend (UI, Shaka Player, consumo de API) | Revisor / pruebas | Autor principal |
| Infraestructura (Terraform, EKS, DocumentDB) | Autora principal | Revisor / validación de `plan` |
| Pipelines CI/CD (GitHub Actions, Dev/Prod) | Autor principal | Revisor / aprobación a Prod |
| Observabilidad (X-Ray/ADOT, CloudWatch, métricas) | Coautoría | Coautoría |
| Documentación (Wiki, backlog, reporte final) | Coautoría | Coautoría |

Ambas personas revisan los PR de la otra: **nadie aprueba su propio PR**. La rotación permite que ambos
puedan explicar el código y la infraestructura durante la presentación.

## Entregable del curso

El proyecto representa **33.33%** de la calificación y requiere promedio **≥ 60** para aprobar. Incluye el
reporte con: descripción, diseño de la arquitectura, explicación de la arquitectura, **distribución de
actividades**, conclusiones y mejoras pendientes. Se permite el uso de IA siempre que se conserven las
tecnologías vistas en clase y el equipo pueda explicar el código.
