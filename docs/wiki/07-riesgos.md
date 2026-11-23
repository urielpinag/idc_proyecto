# 07 · Riesgos y pendientes de confirmar

Registro de riesgos del proyecto y decisiones que **aún no** están cerradas. Cada riesgo indica su impacto,
mitigación y responsable.

## R1 · Rúbrica con "Azure Portal o CloudFlare" vs. AWS + CloudWatch

- **Riesgo:** la rúbrica de la presentación menciona mostrar **recursos y métricas en Azure Portal o
  CloudFlare**; con AWS los recursos y métricas se muestran en **CloudWatch / la consola de AWS**.
- **Impacto:** medio — podría no aceptarse la evidencia de monitoreo.
- **Mitigación:** **PENDIENTE DE CONFIRMAR CON EL PROFESOR**. Argumento: la guía de aprendizaje del curso
  permite explícitamente **"AWS, Microsoft Azure u otro"** como plataforma de despliegue.
- **Responsable:** Persona A (confirmación) · Persona B (registro en el reporte).

## R1b · Rúbrica nombra Prometheus/Grafana vs. AWS CloudWatch + X-Ray/ADOT

- **Riesgo:** la rúbrica (S13) nombra **Prometheus/Grafana** para monitoreo y **APM**; el proyecto usa
  **AWS CloudWatch** (métricas, logs, Container Insights) y **X-Ray/ADOT** (trazas). La sustitución no está
  enumerada como aprobada.
- **Impacto:** bajo/medio — podría no aceptarse la evidencia de monitoreo/APM con la herramienta pedida.
- **Mitigación:** **PENDIENTE DE CONFIRMAR CON EL PROFESOR**. Argumento: la guía de aprendizaje del curso
  permite explícitamente **AWS** y nombra **Prometheus/Grafana** entre las tecnologías vistas en clase, que se
  citan como base del stack; se explica la equivalencia funcional CloudWatch + X-Ray/ADOT.
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

- **Riesgo:** DocumentDB es compatible con la API de **MongoDB ~3.6/4.0**; la propuesta usa **MongoDB 8 +
  Mongoose**. Operadores, índices o transacciones recientes pueden no existir.
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

## Resumen

| ID | Riesgo | Impacto | Estado |
|----|--------|---------|--------|
| R1 | CloudWatch vs. Azure/CloudFlare en la rúbrica | Medio | **Pendiente de confirmar** |
| R1b | CloudWatch + X-Ray/ADOT vs. Prometheus/Grafana en la rúbrica | Bajo/Medio | **Pendiente de confirmar** |
| R2 | Coste EKS + DocumentDB | Alto | Mitigación definida |
| R3 | Compatibilidad DocumentDB ↔ Mongoose | Alto | A validar en Dev |
| R4 | APM y Terraform autodidactas | Medio | Mitigación definida |
| R5 | Dependencia de M3U de terceros | Medio | Mitigación definida |
| R6 | Demo en vivo | Medio | Mitigación definida |
| R7 | Cobertura 80% bloqueante | Bajo/Medio | Mitigación definida |
| R8 | Uso de IA | Bajo | Mitigación definida |
