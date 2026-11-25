import type { MongoMemoryServer } from 'mongodb-memory-server';
import { Types, type IndexDefinition, type IndexOptions } from 'mongoose';

import { connectDatabase, disconnectDatabase } from '../../src/config/database.js';
import {
  Channel,
  Favorite,
  Playlist,
  Session,
  User,
  WatchHistory,
} from '../../src/models/index.js';
import { startInMemoryMongo } from '../helpers/in-memory-mongo.js';

/** Nombres de índices declarados por cada esquema, para comparar sin timing. */
function indexKeys(model: { schema: { indexes(): [IndexDefinition, IndexOptions?][] } }): string[] {
  return model.schema
    .indexes()
    .map(([fields]) => Object.keys(fields).sort().join(','))
    .sort();
}

describe('modelos Mongoose', () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await startInMemoryMongo();
    await connectDatabase(mongod.getUri());
    // Crea los índices una sola vez para que los duplicados se rechacen.
    await Promise.all([
      User.init(),
      Session.init(),
      Playlist.init(),
      Channel.init(),
      Favorite.init(),
      WatchHistory.init(),
    ]);
  }, 180_000);

  afterEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      Session.deleteMany({}),
      Playlist.deleteMany({}),
      Channel.deleteMany({}),
      Favorite.deleteMany({}),
      WatchHistory.deleteMany({}),
    ]);
  });

  afterAll(async () => {
    await disconnectDatabase();
    if (mongod !== undefined) {
      await mongod.stop();
    }
  });

  describe('User', () => {
    it('crea un usuario con rol y estado por defecto', async () => {
      const created = await User.create({
        email: 'Ana@Example.com ',
        passwordHash: 'hash',
        displayName: 'Ana',
      });

      expect(created.email).toBe('ana@example.com');
      expect(created.role).toBe('user');
      expect(created.isActive).toBe(true);
      expect(created.createdAt).toBeInstanceOf(Date);
      expect(created.updatedAt).toBeInstanceOf(Date);
    });

    it('exige email, passwordHash y displayName', async () => {
      await expect(User.create({ passwordHash: 'h', displayName: 'X' })).rejects.toThrow(
        /email/,
      );
      await expect(User.create({ email: 'a@b.c', displayName: 'X' })).rejects.toThrow(
        /passwordHash/,
      );
      await expect(User.create({ email: 'a@b.c', passwordHash: 'h' })).rejects.toThrow(
        /displayName/,
      );
    });

    it('rechaza un rol fuera del enum', async () => {
      await expect(
        User.create({
          email: 'a@b.c',
          passwordHash: 'h',
          displayName: 'X',
          role: 'root',
        }),
      ).rejects.toThrow(/enum/);
    });

    it('rechaza emails duplicados', async () => {
      await User.create({ email: 'dup@b.c', passwordHash: 'h', displayName: 'A' });

      await expect(
        User.create({ email: 'dup@b.c', passwordHash: 'h', displayName: 'B' }),
      ).rejects.toThrow(/duplicate key/);
    });

    it('lee, actualiza y elimina un usuario', async () => {
      const created = await User.create({
        email: 'upd@b.c',
        passwordHash: 'h',
        displayName: 'A',
      });

      const read = await User.findById(created._id);
      expect(read?.displayName).toBe('A');

      await User.updateOne({ _id: created._id }, { $set: { displayName: 'B' } });
      expect((await User.findById(created._id))?.displayName).toBe('B');

      await User.deleteOne({ _id: created._id });
      expect(await User.findById(created._id)).toBeNull();
    });

    it('declara el índice único de email', () => {
      const indexes = User.schema.indexes();
      const emailIndex = indexes.find(([fields]) => 'email' in fields);

      expect(emailIndex?.[1]).toMatchObject({ unique: true });
      expect(indexKeys(User)).toContain('email');
    });
  });

  describe('Session', () => {
    it('crea una sesión con revokedAt en null', async () => {
      const session = await Session.create({
        userId: new Types.ObjectId(),
        refreshTokenHash: 'rt-1',
        expiresAt: new Date(Date.now() + 60_000),
      });

      expect(session.revokedAt).toBeNull();
      expect(session.userAgent).toBeUndefined();
    });

    it('exige userId, refreshTokenHash y expiresAt', async () => {
      await expect(
        Session.create({ refreshTokenHash: 'rt-2', expiresAt: new Date() }),
      ).rejects.toThrow(/userId/);
      await expect(
        Session.create({ userId: new Types.ObjectId(), expiresAt: new Date() }),
      ).rejects.toThrow(/refreshTokenHash/);
      await expect(
        Session.create({ userId: new Types.ObjectId(), refreshTokenHash: 'rt-3' }),
      ).rejects.toThrow(/expiresAt/);
    });

    it('rechaza refreshTokenHash duplicado', async () => {
      const payload = {
        userId: new Types.ObjectId(),
        refreshTokenHash: 'rt-dup',
        expiresAt: new Date(),
      };
      await Session.create(payload);

      await expect(Session.create(payload)).rejects.toThrow(/duplicate key/);
    });

    it('lee y revoca una sesión', async () => {
      const created = await Session.create({
        userId: new Types.ObjectId(),
        refreshTokenHash: 'rt-rev',
        expiresAt: new Date(),
      });

      const revokedAt = new Date();
      await Session.updateOne({ _id: created._id }, { $set: { revokedAt } });

      const read = await Session.findById(created._id);
      expect(read?.revokedAt?.toISOString()).toBe(revokedAt.toISOString());

      await Session.deleteOne({ _id: created._id });
      expect(await Session.findById(created._id)).toBeNull();
    });

    it('declara índices de userId, expiresAt y refreshTokenHash único', () => {
      const keys = indexKeys(Session);
      expect(keys).toContain('userId');
      expect(keys).toContain('expiresAt');
      expect(keys).toContain('refreshTokenHash');

      const hashIndex = Session.schema
        .indexes()
        .find(([fields]) => 'refreshTokenHash' in fields);
      expect(hashIndex?.[1]).toMatchObject({ unique: true });
    });
  });

  describe('Channel', () => {
    const base = {
      name: 'Canal Uno',
      streamUrl: 'https://example.com/uno.m3u8',
      country: 'MX',
    };

    it('crea un canal activo con categorías vacías', async () => {
      const channel = await Channel.create({ ...base, categories: ['noticias'] });

      expect(channel.categories).toEqual(['noticias']);
      expect(channel.isActive).toBe(true);
      expect(channel.playlistId).toBeUndefined();
    });

    it('exige name, streamUrl y country', async () => {
      await expect(
        Channel.create({ streamUrl: 'x', country: 'MX' }),
      ).rejects.toThrow(/name/);
      await expect(Channel.create({ name: 'n', country: 'MX' })).rejects.toThrow(
        /streamUrl/,
      );
      await expect(Channel.create({ name: 'n', streamUrl: 'x' })).rejects.toThrow(
        /country/,
      );
    });

    it('lee, desactiva y elimina un canal', async () => {
      const created = await Channel.create(base);

      await Channel.updateOne({ _id: created._id }, { $set: { isActive: false } });
      expect((await Channel.findById(created._id))?.isActive).toBe(false);

      await Channel.deleteOne({ _id: created._id });
      expect(await Channel.countDocuments({})).toBe(0);
    });

    it('declara índices de name, country, categories y playlistId', () => {
      const keys = indexKeys(Channel);
      expect(keys).toContain('name');
      expect(keys).toContain('country');
      expect(keys).toContain('categories');
      expect(keys).toContain('playlistId');
    });
  });

  describe('Playlist', () => {
    it('crea una playlist con channelCount en 0', async () => {
      const playlist = await Playlist.create({
        name: 'Lista',
        sourceUrl: 'https://example.com/lista.m3u',
      });

      expect(playlist.channelCount).toBe(0);
      expect(playlist.lastSyncedAt).toBeUndefined();
    });

    it('exige name y sourceUrl', async () => {
      await expect(Playlist.create({ sourceUrl: 'u' })).rejects.toThrow(/name/);
      await expect(Playlist.create({ name: 'n' })).rejects.toThrow(/sourceUrl/);
    });

    it('rechaza sourceUrl duplicada', async () => {
      const sourceUrl = 'https://example.com/dup.m3u';
      await Playlist.create({ name: 'A', sourceUrl });

      await expect(Playlist.create({ name: 'B', sourceUrl })).rejects.toThrow(
        /duplicate key/,
      );
    });

    it('lee, actualiza y elimina una playlist', async () => {
      const created = await Playlist.create({
        name: 'Lista',
        sourceUrl: 'https://example.com/upd.m3u',
      });

      const syncedAt = new Date();
      await Playlist.updateOne(
        { _id: created._id },
        { $set: { lastSyncedAt: syncedAt, channelCount: 12 } },
      );

      const read = await Playlist.findById(created._id);
      expect(read?.channelCount).toBe(12);
      expect(read?.lastSyncedAt?.toISOString()).toBe(syncedAt.toISOString());

      await Playlist.deleteOne({ _id: created._id });
      expect(await Playlist.findById(created._id)).toBeNull();
    });

    it('declara el índice único de sourceUrl', () => {
      const index = Playlist.schema.indexes().find(([fields]) => 'sourceUrl' in fields);
      expect(index?.[1]).toMatchObject({ unique: true });
    });
  });

  describe('Favorite', () => {
    it('crea un favorito con createdAt por defecto', async () => {
      const favorite = await Favorite.create({
        userId: new Types.ObjectId(),
        channelId: new Types.ObjectId(),
      });

      expect(favorite.createdAt).toBeInstanceOf(Date);
    });

    it('exige userId y channelId', async () => {
      await expect(
        Favorite.create({ channelId: new Types.ObjectId() }),
      ).rejects.toThrow(/userId/);
      await expect(Favorite.create({ userId: new Types.ObjectId() })).rejects.toThrow(
        /channelId/,
      );
    });

    it('rechaza el mismo par userId+channelId repetido', async () => {
      const pair = { userId: new Types.ObjectId(), channelId: new Types.ObjectId() };
      await Favorite.create(pair);

      await expect(Favorite.create(pair)).rejects.toThrow(/duplicate key/);

      // Otro canal del mismo usuario sí se permite.
      await expect(
        Favorite.create({ userId: pair.userId, channelId: new Types.ObjectId() }),
      ).resolves.toBeDefined();
    });

    it('elimina un favorito', async () => {
      const created = await Favorite.create({
        userId: new Types.ObjectId(),
        channelId: new Types.ObjectId(),
      });

      await Favorite.deleteOne({ _id: created._id });
      expect(await Favorite.countDocuments({})).toBe(0);
    });

    it('declara el índice compuesto único userId+channelId', () => {
      const index = Favorite.schema
        .indexes()
        .find(([fields]) => 'userId' in fields && 'channelId' in fields);

      expect(index?.[1]).toMatchObject({ unique: true });
    });
  });

  describe('WatchHistory', () => {
    it('crea una entrada con watchedAt por defecto y acepta duración 0', async () => {
      const entry = await WatchHistory.create({
        userId: new Types.ObjectId(),
        channelId: new Types.ObjectId(),
        durationSeconds: 0,
      });

      expect(entry.watchedAt).toBeInstanceOf(Date);
      expect(entry.durationSeconds).toBe(0);
    });

    it('exige durationSeconds y rechaza valores negativos', async () => {
      const refs = { userId: new Types.ObjectId(), channelId: new Types.ObjectId() };

      await expect(WatchHistory.create(refs)).rejects.toThrow(/durationSeconds/);
      await expect(
        WatchHistory.create({ ...refs, durationSeconds: -1 }),
      ).rejects.toThrow(/durationSeconds/);
    });

    it('lee y elimina una entrada del historial', async () => {
      const created = await WatchHistory.create({
        userId: new Types.ObjectId(),
        channelId: new Types.ObjectId(),
        durationSeconds: 42,
      });

      const read = await WatchHistory.findById(created._id);
      expect(read?.durationSeconds).toBe(42);

      await WatchHistory.deleteOne({ _id: created._id });
      expect(await WatchHistory.findById(created._id)).toBeNull();
    });

    it('declara el índice userId+watchedAt', () => {
      const index = WatchHistory.schema
        .indexes()
        .find(([fields]) => 'userId' in fields && 'watchedAt' in fields);

      expect(index).toBeDefined();
    });
  });
});
