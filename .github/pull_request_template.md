# Plantilla de Pull Request

## Descripción

<!-- Explica qué cambia y por qué. Enlaza el issue correspondiente. -->

Closes #<issue>

## Tipo de cambio

- [ ] `feat:` nueva funcionalidad
- [ ] `fix:` corrección de error
- [ ] `docs:` documentación / Wiki
- [ ] `test:` pruebas
- [ ] `infra:` Terraform / workflows / manifiestos
- [ ] `chore:` mantenimiento

## Criterios de aceptación

<!-- Copia el checklist del issue y marca lo cumplido. -->

- [ ] Criterio 1
- [ ] Criterio 2
- [ ] Criterio 3

## Checklist del autor

- [ ] El cambio es **pequeño y coherente** (una sola lógica).
- [ ] Los **criterios de aceptación** del issue están cumplidos.
- [ ] **Pruebas unitarias** añadidas o actualizadas y pasando.
- [ ] **Cobertura ≥ 80%** (bloqueante en el pipeline).
- [ ] El **cambio está documentado** (Wiki / README / comentarios donde aplique).
- [ ] No se commitean secretos (credenciales, cadenas de conexión, tokens).
- [ ] **Ambiente Dev verificado**: URL de Dev probada tras el pipeline.
- [ ] Si toca `/infra`: `terraform fmt -check` y `terraform plan` revisados.

## Checklist del revisor

- [ ] El cambio no sale del alcance del issue.
- [ ] El código es comprensible y el autor puede explicarlo.
- [ ] Se conservan las tecnologías del curso (Docker, Kubernetes, Terraform, pipelines).
- [ ] Los checks de CI están en verde (build + pruebas + cobertura).
- [ ] No hay regresiones evidentes en Dev.

## Evidencia

<!-- Capturas, logs del pipeline, URL de Dev. -->
