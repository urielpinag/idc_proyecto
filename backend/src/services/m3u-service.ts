/**
 * Importación y re-sincronización de listas M3U (`/api/playlists`).
 *
 * - El parser es deliberadamente simple: cada entrada `#EXTINF` agrupa sus
 *   atributos `clave="valor"` y el nombre tras la coma; la primera línea con
 *   una URL que la sigue es su `streamUrl`.
 * - El país se toma del atributo propio `tvg-country` (o `country`); si falta,
 *   se usa `Desconocido`.
 * - La re-sincronización es idempotente: la playlist se busca por `sourceUrl` y
 *   cada canal se actualiza con `findOneAndUpdate`/upsert por
 *   `{ playlistId, streamUrl }`, sin duplicar canales.
 */

import { isValidObjectId } from 'mongoose';

import { HttpError, NotFoundError } from '../errors/errors.js';
import { Channel, Playlist, type PlaylistDoc } from '../models/index.js';

const MAX_NAME_LENGTH = 120;
const MAX_URL_LENGTH = 2048;
const DEFAULT_COUNTRY = 'Desconocido';

export type PlaylistInput = {
  name?: unknown;
  sourceUrl?: unknown;
  content?: unknown;
};

export type ParsedChannel = {
  name: string;
  logoUrl?: string;
  streamUrl: string;
  categories: string[];
  country: string;
};

export type PlaylistSyncResult = {
  playlist: {
    id: string;
    name: string;
    sourceUrl: string;
    channelCount: number;
    lastSyncedAt: string;
    createdAt: string;
    updatedAt: string;
  };
  imported: number;
};

function readBlockAttribute(block: string[], key: string): string | undefined {
  const pattern = new RegExp(`(?:^|\\s)${key}="([^"]*)"`);
  for (const line of block) {
    const match = pattern.exec(line);
    if (match?.[1] && match[1].trim().length > 0) {
      return match[1].trim();
    }
  }
  return undefined;
}

function readBlockName(block: string[]): string | undefined {
  for (const line of block) {
    const index = line.indexOf(',');
    if (index === -1) {
      continue;
    }
    const name = line.slice(index + 1).trim();
    if (name.length > 0) {
      return name;
    }
  }
  return undefined;
}

/**
 * Parsea el contenido de una lista M3U. Ignora cabeceras, comentarios y
 * entradas sin URL o sin nombre.
 */
export function parseM3U(content: string): ParsedChannel[] {
  const channels: ParsedChannel[] = [];
  const lines = content.split(/\r?\n/);
  let block: string[] | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith('#')) {
      if (line.startsWith('#EXTINF')) {
        block = [line];
      } else if (block) {
        block.push(line);
      }
      continue;
    }

    if (!block) {
      continue;
    }

    const name = readBlockName(block);
    if (!name) {
      block = null;
      continue;
    }

    const group = readBlockAttribute(block, 'group-title');
    channels.push({
      name,
      logoUrl: readBlockAttribute(block, 'tvg-logo'),
      streamUrl: line,
      categories: group ? [group] : [],
      country:
        readBlockAttribute(block, 'tvg-country') ?? readBlockAttribute(block, 'country') ?? DEFAULT_COUNTRY,
    });
    block = null;
  }

  return channels;
}

function readRequiredString(value: unknown, field: string): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.length === 0) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Datos de la playlist inválidos.', {
      fields: { [field]: 'Este campo es obligatorio.' },
    });
  }
  return text;
}

function validateSyncInput(body: PlaylistInput): { name: string; sourceUrl: string; content: string } {
  const name = readRequiredString(body.name, 'name');
  const sourceUrl = readRequiredString(body.sourceUrl, 'sourceUrl');
  const content = readRequiredString(body.content, 'content');

  const fields: Record<string, string> = {};
  if (name.length > MAX_NAME_LENGTH) {
    fields.name = `No puede superar ${MAX_NAME_LENGTH} caracteres.`;
  }
  if (sourceUrl.length > MAX_URL_LENGTH) {
    fields.sourceUrl = `No puede superar ${MAX_URL_LENGTH} caracteres.`;
  }
  if (Object.keys(fields).length > 0) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Datos de la playlist inválidos.', { fields });
  }

  if (parseM3U(content).length === 0) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'El contenido M3U no contiene canales válidos.', {
      fields: { content: 'El contenido M3U no contiene canales válidos.' },
    });
  }

  return { name, sourceUrl, content };
}

function toPublicPlaylist(playlist: PlaylistDoc): PlaylistSyncResult['playlist'] {
  return {
    id: playlist._id.toString(),
    name: playlist.name,
    sourceUrl: playlist.sourceUrl,
    channelCount: playlist.channelCount,
    lastSyncedAt: (playlist.lastSyncedAt ?? new Date()).toISOString(),
    createdAt: playlist.createdAt.toISOString(),
    updatedAt: playlist.updatedAt.toISOString(),
  };
}

/**
 * Importa o re-sincroniza una playlist: upsert de la playlist por `sourceUrl` y
 * upsert de cada canal por `{ playlistId, streamUrl }`.
 */
export async function syncPlaylist(body: PlaylistInput): Promise<PlaylistSyncResult> {
  const { name, sourceUrl, content } = validateSyncInput(body);
  const parsed = parseM3U(content);
  const syncedAt = new Date();

  const playlist = await Playlist.findOneAndUpdate(
    { sourceUrl },
    { name, sourceUrl, channelCount: parsed.length, lastSyncedAt: syncedAt },
    { new: true, upsert: true },
  ).exec();

  for (const channel of parsed) {
    await Channel.findOneAndUpdate(
      { playlistId: playlist._id, streamUrl: channel.streamUrl },
      {
        name: channel.name,
        logoUrl: channel.logoUrl,
        categories: channel.categories,
        country: channel.country,
        isActive: true,
      },
      { upsert: true, setDefaultsOnInsert: true },
    ).exec();
  }

  return { playlist: toPublicPlaylist(playlist), imported: parsed.length };
}

/** Lista las playlists importadas, de la más reciente a la más antigua. */
export async function listPlaylists(): Promise<PlaylistSyncResult['playlist'][]> {
  const playlists = await Playlist.find().sort({ createdAt: -1 }).exec();
  return playlists.map(toPublicPlaylist);
}

/** Devuelve una playlist por id; 404 si no existe. */
export async function getPlaylistById(id: unknown): Promise<PlaylistSyncResult['playlist']> {
  if (typeof id !== 'string' || !isValidObjectId(id)) {
    throw new NotFoundError('Playlist no encontrada.');
  }
  const playlist = await Playlist.findById(id).exec();
  if (!playlist) {
    throw new NotFoundError('Playlist no encontrada.');
  }
  return toPublicPlaylist(playlist);
}
