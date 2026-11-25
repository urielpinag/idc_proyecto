import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { isSafeHlsUrl } from '../js/api.js';

const STUB_URL = new URL('../stubs/channels.json', import.meta.url);
const REQUIRED_FIELDS = ['id', 'name', 'streamUrl', 'country', 'categories', 'isActive'];

const readStub = async () => JSON.parse(await readFile(STUB_URL, 'utf8'));

test('stubs/channels.json es JSON válido con meta y channels', async () => {
  const stub = await readStub();
  assert.equal(typeof stub, 'object');
  assert.ok(Array.isArray(stub.channels), 'channels debe ser un array');
  assert.ok(stub.channels.length >= 3, 'debe haber al menos 3 canales sintéticos');
  assert.equal(stub.meta.synthetic, true, 'el stub debe declararse sintético');
});

test('cada canal tiene los campos del contrato Channel', async () => {
  const { channels } = await readStub();
  for (const channel of channels) {
    for (const field of REQUIRED_FIELDS) {
      assert.ok(field in channel, `el canal ${channel.id || '?'} debe tener "${field}"`);
    }
    assert.ok(Array.isArray(channel.categories) && channel.categories.length > 0);
    assert.equal(typeof channel.isActive, 'boolean');
  }
});

test('los ids son únicos y todos los canales apuntan a un stream HLS seguro', async () => {
  const { channels } = await readStub();
  const ids = new Set();
  for (const channel of channels) {
    assert.ok(!ids.has(channel.id), `id duplicado: ${channel.id}`);
    ids.add(channel.id);

    assert.equal(isSafeHlsUrl(channel.streamUrl), true, `el stream de ${channel.id} debe ser HLS seguro`);
    const url = new URL(channel.streamUrl);
    assert.equal(url.protocol, 'https:', `el stream de ${channel.id} debe ser https`);
    assert.ok(/\.m3u8$/i.test(url.pathname), `el stream de ${channel.id} debe terminar en .m3u8`);
    assert.equal(url.username, '', 'sin usuario embebido');
    assert.equal(url.password, '', 'sin contraseña embebida');
    assert.equal(url.search, '', `el stream de ${channel.id} no debe llevar query (token=)`);
    assert.equal(url.hostname.endsWith('tv.hub'), false, 'sin contenido de tv.hub');
  }
});

test('el stub no contiene contenido ni credenciales de tv.hub', async () => {
  const raw = await readFile(STUB_URL, 'utf8');
  assert.ok(!/tv\.hub/i.test(raw));
  assert.ok(!/token\s*=/i.test(raw));
  assert.ok(!/eyJ[A-Za-z0-9_-]{10,}/.test(raw), 'sin JWT');
});

test('hay al menos dos países y dos categorías para probar los filtros', async () => {
  const { channels } = await readStub();
  const countries = new Set(channels.map((c) => c.country));
  const categories = new Set(channels.flatMap((c) => c.categories));
  assert.ok(countries.size >= 2, 'se esperaban al menos 2 países');
  assert.ok(categories.size >= 2, 'se esperaban al menos 2 categorías');
  assert.ok(channels.some((c) => c.isActive === false), 'debe haber un canal inactivo para probar el filtrado');
});
