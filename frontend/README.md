# `frontend/` — Interfaz web de TV Hub

Carpeta de la **interfaz del reproductor IPTV** de TV Hub.

## Propósito

Aquí vivirá la aplicación web que consume la API de `/backend`: pantalla de login, catálogo con filtros por
país y categoría, reproductor de los canales, favoritos e historial.

## Stack previsto

- **HTML, CSS y JavaScript vanilla**, sin framework ni compilación pesada.
- **Shaka Player** para la reproducción de streams **HLS** en el navegador.
- Servida en el clúster de **EKS** como su propio *Deployment* (`tvhub-web`) detrás del Ingress/ALB.

## Estado actual

**Carpeta vacía a propósito.** Todavía no hay páginas, estilos ni scripts: llegarán con los issues de la
épica de frontend. Este README solo documenta qué se va a construir aquí.
