# 07 · Riesgos y pendientes de confirmar

Registro de riesgos del proyecto. Cada riesgo indica su impacto, mitigación y responsable. **R1 y R1b**
quedaron **confirmados por el profesor el 25 nov 2026**; **sigue pendiente R2** (cuenta AWS con tope de
gasto).

## R1 · Rúbrica con "Azure Portal o CloudFlare" vs. AWS + CloudWatch

- **Riesgo:** la rúbrica —**S13 "DevOps Summary", slide 16**, que pide mostrar los recursos en **"Azure Portal
  o CloudFlare"**— menciona **recursos y métricas en Azure Portal o CloudFlare**; con AWS los recursos
  y métricas se muestran en **CloudWatch / la consola de AWS**.
- **Impacto:** medio — podría no aceptarse la evidencia de monitoreo.
- **Mitigación:** **CONFIRMADO POR EL PROFESOR — 25 nov 2026**. La
  **`Guia_Aprendizaje_O2026_ESI3905O.docx`** (material **externo al repo**, no versionado) permite
  explícitamente **"AWS, Microsoft Azure u otro"** como plataforma de despliegue y **"código en GitHub o
  Azure DevOps"**, así que la plataforma es válida sin necesidad de excepción. Respuesta del profesor
  (25 nov 2026): *(i)* «Para GitHub + AWS/EKS/DocumentDB, sí está bien ese stack tecnológico» y *(ii)*
  «Para CloudWatch + X-Ray/ADOT para APM, está bien también ya que es lo que mejor se va a adaptar con las
  herramientas que elegimos». Ver *Justificación de las decisiones de plataforma y observabilidad*.
- **Responsable:** Persona A (confirmación) · Persona B (registro en el reporte).

## R1b · Rúbrica nombra Prometheus/Grafana vs. AWS CloudWatch + X-Ray/ADOT

- **Riesgo:** la **`Guia_Aprendizaje_O2026_ESI3905O.docx`** (apartado de *tecnologías vistas* / PROYECTO)
  nombra **Prometheus/Grafana** entre las tecnologías vistas en clase y **S13 "DevOps Summary" slide 16**
  pide **"Monitoring | Logging | APM"**; el proyecto usa **AWS CloudWatch** (métricas, logs, Container
  Insights) y **X-Ray/ADOT** (trazas). **S13 no nombra Prometheus/Grafana**: esa exigencia viene de la guía
  DOCX. Ambas fuentes son **externas al repo** (diapositivas del curso y guía, no versionadas). La sustitución
  no está enumerada como aprobada.
- **Impacto:** bajo/medio — podría no aceptarse la evidencia de monitoreo/APM con la herramienta pedida.
- **Mitigación:** **CONFIRMADO POR EL PROFESOR — 25 nov 2026**: **Prometheus/Grafana queda descartado con
  autorización**. Respuesta del profesor: «**no es necesario lo de Prometheus/Grafana ya que ya tenemos las
  otras como herramientas para observabilidad**». La guía de aprendizaje del curso
  (`Guia_Aprendizaje_O2026_ESI3905O.docx`) permite explícitamente **AWS** y nombra **Prometheus/Grafana** entre
  las tecnologías vistas en clase, pero **S13 "DevOps Summary" slide 16** pide «Monitoring | Logging | APM»
  **sin imponer una herramienta concreta**; la equivalencia funcional **CloudWatch + X-Ray/ADOT** cubre ese
  punto. Es una **excepción justificada y autorizada**: se mantiene el resto de tecnologías vistas en clase y
  se sustituye únicamente la herramienta de observabilidad por su equivalente nativo de AWS. Ver
  *Justificación de las decisiones de plataforma y observabilidad*.
- **Responsable:** Persona A (confirmación) · Persona B (registro en el reporte).

## R2 · Coste real de EKS y DocumentDB

- **Riesgo:** **EKS** (control plane + nodos + NAT Gateway) y **Amazon DocumentDB** **no tienen free
  tier**; el gasto crece por hora con recursos encendidos.
- **Impacto:** alto — coste fuera de presupuesto de estudiante.
- **Mitigación:** plan de **apagado/recorte fuera de la demo** (nodos mínimos, `terraform destroy` o
  scale-down, DocumentDB apagado), estimar coste por hora y revisar antes de cada sesión
  (`TVH-48`).
- **Responsable:** Persona B.

## R3 · Compatibilidad DocumentDB ↔ MongoDB 8 + Mongoose

- **Riesgo:** la propuesta
  ([`../TV_Hub_Propuesta_Proyecto_Final.pdf`](../TV_Hub_Propuesta_Proyecto_Final.pdf)) usa **MongoDB 8 +
  Mongoose**, mientras que DocumentDB es compatible con la API de **MongoDB ~3.6/4.0**; operadores, índices o
  transacciones recientes pueden no existir.
- **Impacto:** alto — la app podría no arrancar o fallar en consultas.
- **Mitigación:** fijar versiones del driver/Mongoose compatibles, evitar operadores fuera de 4.0 y
  **validar conectividad + CRUD + sync M3U en Dev** antes de fijar el stack (`TVH-29`).
- **Responsable:** Persona A.

## R4 · APM y Terraform se exigen pero no se enseñan

- **Riesgo:** la rúbrica exige **APM (trazas, errores, mensajes)** y **Terraform**, pero no se enseñan en el
  curso (S13 slide 16).
- **Impacto:** medio — esfuerzo **autodidacta** y riesgo de retrasos.
- **Mitigación:** reservar tiempo en M2–M3, apoyarse en la documentación oficial de ADOT/X-Ray y Terraform
  AWS, y documentar el aprendizaje en la Wiki.
- **Responsable:** ambos.

## R5 · Dependencia de proveedores IPTV/M3U de terceros

- **Riesgo:** los streams **HLS** dependen de listas M3U de terceros; pueden caerse, cambiar de URL o tener
  problemas de disponibilidad/legalidad.
- **Impacto:** medio — la demo de reproducción puede fallar.
- **Mitigación:** usar un **set fijo de canales de prueba** importado y versionado para la demo, validar los
  streams antes de presentar y no depender de un proveedor en vivo.
- **Responsable:** Persona B.

## R6 · Demo en vivo dependiente de la red y del clúster

- **Riesgo:** la demo requiere URL pública, pipeline en vivo y aprobación; una caída de red o de cuota
  arruina la presentación.
- **Impacto:** medio.
- **Mitigación:** **ensayo completo** (`TVH-45`), capturas de respaldo de cada paso y dejar los recursos
  encendidos durante la presentación.
- **Responsable:** ambos.

## R7 · Cobertura bloqueante del 80%

- **Riesgo:** el umbral **bloqueante** puede frenar merges al inicio.
- **Impacto:** bajo/medio.
- **Mitigación:** escribir pruebas junto con cada controlador (`TVH-34`) y revisar la cobertura local antes
  de abrir el PR.
- **Responsable:** ambos.

## R8 · IA permitida con condiciones

- **Riesgo:** el curso permite IA **solo si** se conservan las tecnologías vistas en clase y el equipo
  **puede explicar el código**.
- **Impacto:** bajo.
- **Mitigación:** cada autor revisa y explica su código; la revisión cruzada por PR garantiza que ambos
  entiendan todo el sistema.
- **Responsable:** ambos.

## Justificación de las decisiones de plataforma y observabilidad

Respuestas del profesor y la justificación técnica que las sostiene (25 nov 2026).

- **(i) GitHub + AWS / EKS + DocumentDB:** la guía `Guia_Aprendizaje_O2026_ESI3905O.docx` permite
  explícitamente *«AWS, Microsoft Azure, u otro»* y *«código en GitHub o Azure DevOps»*, así que la
  plataforma es válida sin necesidad de excepción. **EKS** lleva a la nube el **Kubernetes** visto en clase
  (S14/minikube: Deployment, Service, Ingress, HPA, metrics-server) y mantiene los contenedores Docker del
  curso. **DocumentDB** es el equivalente gestionado de **MongoDB/Mongoose**, la BD de la propuesta TV Hub,
  evitando operar un StatefulSet propio. Se conservan todas las tecnologías vistas (Docker, Kubernetes,
  Terraform, pipelines YAML, GitHub Actions) y el código sigue siendo explicable por el equipo, cumpliendo la
  regla de la guía sobre uso de IA.
- **(ii) CloudWatch + AWS X-Ray / ADOT:** es la suite **nativa de AWS** y por eso «mejor se adapta a las
  herramientas elegidas»: **CloudWatch Logs** recoge errores y mensajes, **X-Ray / ADOT (OpenTelemetry)**
  produce las **trazas distribuidas** del backend, **Container Insights** aporta **CPU y Memoria** de los pods
  de EKS y las **métricas del ALB** aportan **Request**; todo se unifica en un **dashboard de CloudWatch**.
  Application Insights/Azure Monitor y Cloudflare Analytics no aplican porque no hay recursos en Azure ni
  Cloudflare. Se satisfacen íntegramente «APM: Trazas, Errores, Mensajes» y «métricas CPU, Memoria, Request»
  de la rúbrica, sustituyendo el «portal de Azure o Cloudflare» por su equivalente funcional en AWS.
- **(iii) Docker Hub + GitHub Secrets + rol IAM vía OIDC:** la rúbrica pide «Docker Hub: Service
  connection». En Azure DevOps eso es una *service connection*; en **GitHub Actions** el equivalente son
  **GitHub Secrets** (`DOCKERHUB_USERNAME`/`DOCKERHUB_TOKEN`) para el registry y un **rol IAM asumido por
  OIDC** para que el workflow hable con AWS **sin credenciales estáticas** (más seguro que guardar access
  keys). Se mantiene **Docker Hub** como registry (no ECR), tal como pide la rúbrica.
- **(iv) Sin Prometheus/Grafana:** la guía DOCX los nombra entre las tecnologías vistas, pero **S13 "DevOps
  Summary" slide 16 pide «Monitoring | Logging | APM» sin imponer una herramienta concreta**, y el profesor
  confirmó que con **CloudWatch + X-Ray/ADOT** basta. Añadirlos **duplicaría la instrumentación** (métricas ya
  cubiertas por Container Insights + ALB), añadiría componentes que **no se integran de forma nativa con el
  stack AWS elegido** y aumentaría la carga de un equipo de 2. Es una **excepción justificada y autorizada**.

## Resumen

| ID | Riesgo | Impacto | Estado |
|----|--------|---------|--------|
| R1 | CloudWatch vs. Azure/CloudFlare en la rúbrica | Medio | **Confirmado (25 nov 2026)** |
| R1b | CloudWatch + X-Ray/ADOT vs. Prometheus/Grafana en la rúbrica | Bajo/Medio | **Confirmado (25 nov 2026)** |
| R2 | Coste EKS + DocumentDB | Alto | Mitigación definida |
| R3 | Compatibilidad DocumentDB ↔ Mongoose | Alto | A validar en Dev |
| R4 | APM y Terraform autodidactas | Medio | Mitigación definida |
| R5 | Dependencia de M3U de terceros | Medio | Mitigación definida |
| R6 | Demo en vivo | Medio | Mitigación definida |
| R7 | Cobertura 80% bloqueante | Bajo/Medio | Mitigación definida |
| R8 | Uso de IA | Bajo | Mitigación definida |
