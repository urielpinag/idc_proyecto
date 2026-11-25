# TV Hub — canales (stub sintético)

Datos **ficticios** para desarrollar el frontend sin backend. No provienen de ninguna lista M3U real.

## Contrato

Objeto con `channels[]` y `meta`:

```json
{
  "meta": { ... },
  "channels": [
    {
      "id": "canal-demo-01",
      "name": "Canal Demo Uno",
      "description": "…",
      "logoUrl": "",
      "streamUrl": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      "country": "MX",
      "countryLabel": "México",
      "categories": ["Noticias", "General"],
      "isActive": true,
      "playlistId": "playlist-demo"
    }
  ]
}
```

Campos alineados con la entidad **Channel** del contrato
([`wiki/02-componentes.md`](../../../docs/wiki/02-componentes.md)): `name`, `logoUrl`, `streamUrl`,
`country`, `categories`, `isActive`, `playlistId`. Se añaden `id`, `description` y `countryLabel`
para la UI. En producción el backend entregará `_id` y la UI usará `id || _id`.

## Fixture HLS de reproducción

Los canales de prueba apuntan a **streams HLS públicos de tests de terceros** (mux.dev). Son solo para
verificar que el `<video>` reproduce con Shaka: no hay `token=`, ni JWT, ni credenciales, ni contenido de
`tv.hub`. Si el entorno no tiene red, el reproductor muestra un error visible en lugar de fingir éxito.

## Uso

`js/api.js` carga este fichero como respaldo cuando `${API_BASE_URL}/api/channels` no responde, y la UI
lo indica con la etiqueta **Stub**.
