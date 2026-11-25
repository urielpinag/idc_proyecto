import request from 'supertest';

import { loadConfig, parseCorsOrigins, parsePort } from '../src/config/env.js';
import { createApp } from '../src/app.js';

describe('config/env', () => {
  it('usa valores por defecto cuando no hay variables', () => {
    const config = loadConfig({});

    expect(config.port).toBe(3000);
    expect(config.nodeEnv).toBe('development');
    expect(config.mongodbUri).toBeUndefined();
    expect(config.corsOrigins).toEqual([]);
    expect(config.readinessTimeoutMs).toBeGreaterThan(0);
  });

  it('lee PORT, NODE_ENV, MONGODB_URI y CORS_ORIGINS', () => {
    const config = loadConfig({
      PORT: '8080',
      NODE_ENV: 'production',
      MONGODB_URI: '  mongodb://127.0.0.1:27017/tvhub  ',
      CORS_ORIGINS: 'http://a.test, http://b.test ,',
    });

    expect(config.port).toBe(8080);
    expect(config.nodeEnv).toBe('production');
    expect(config.mongodbUri).toBe('mongodb://127.0.0.1:27017/tvhub');
    expect(config.corsOrigins).toEqual(['http://a.test', 'http://b.test']);
  });

  it('trata MONGODB_URI vacía como ausente', () => {
    expect(loadConfig({ MONGODB_URI: '   ' }).mongodbUri).toBeUndefined();
  });

  it('rechaza puertos inválidos', () => {
    expect(() => parsePort('abc')).toThrow(/PORT inválido/);
    expect(() => parsePort('-1')).toThrow(/PORT inválido/);
    expect(() => parsePort('70000')).toThrow(/PORT inválido/);
  });

  it('acepta puerto vacío o indefinido como valor por defecto', () => {
    expect(parsePort(undefined)).toBe(3000);
    expect(parsePort('')).toBe(3000);
    expect(parsePort('0')).toBe(0);
  });

  it('parsea orígenes CORS vacíos como lista vacía', () => {
    expect(parseCorsOrigins(undefined)).toEqual([]);
    expect(parseCorsOrigins('')).toEqual([]);
    expect(parseCorsOrigins(' , ')).toEqual([]);
  });
});

describe('createApp', () => {
  it('permite cualquier origen cuando la lista está vacía', async () => {
    const app = createApp({ corsOrigins: [] });

    const response = await request(app)
      .get('/health')
      .set('Origin', 'http://cualquier-origen.test');

    expect(response.headers['access-control-allow-origin']).toBe('*');
  });

  it('respeta CORS_ORIGINS del entorno cuando no se pasan opciones', async () => {
    const original = process.env.CORS_ORIGINS;
    process.env.CORS_ORIGINS = 'http://env-origin.test';
    try {
      const app = createApp();

      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://env-origin.test');

      expect(response.headers['access-control-allow-origin']).toBe('http://env-origin.test');
    } finally {
      process.env.CORS_ORIGINS = original;
    }
  });
});
