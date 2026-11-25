# `backend/` — API de TV Hub

Carpeta de la **API REST** del proyecto IPTV TV Hub.

## Propósito

Aquí vivirá el servidor que expone los endpoints de la aplicación: login y sesiones, catálogo de canales
filtrable por país y categoría, favoritos, historial de reproducción y las rutas de administración
(importación de listas **M3U** y re-sincronización sin duplicados). También incluirá `/health` y `/ready`.

## Stack previsto

- **Node 22** + **TypeScript** (modo `strict`).
- **Express 5** para las rutas REST.
- **Amazon DocumentDB** como base de datos, con **Mongoose** como ODM.
- **JWT** con refresh rotativo y **bcryptjs** para contraseñas.
- **Jest + Supertest + mongodb-memory-server** para pruebas; cobertura mínima del **80 %** en el pipeline.
- **X-Ray / ADOT (OpenTelemetry)** para trazas y **CloudWatch** para logs.

## Estado actual

**Carpeta vacía a propósito.** Todavía no hay código: el código base
(`package.json`, `tsconfig.json`, servidor, rutas, modelos y pruebas) llegará con los issues de la épica de
backend. Este README solo fija el contrato de qué se va a construir aquí.
