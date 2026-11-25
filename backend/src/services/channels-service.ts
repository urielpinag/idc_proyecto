/**
 * Lógica del catálogo de canales (`/api/channels`).
 *
 * - La lectura pública solo devuelve canales `isActive: true`.
 * - Las mutaciones son administrativas y aquí se validan los datos de entrada.
 * - El borrado es lógico (`isActive: false`) para no romper referencias de
 *   favoritos e historial que apuntan al canal.
 *
 * Las respuestas nunca incluyen datos internos de Mongoose (`__v`).
 */

import { isValidObjectId, Types } from 'mongoose';

import { HttpError, NotFoundError } from '../errors/errors.js';
import { Channel, type ChannelDoc } from '../models/index.js';

const MAX_NAME_LENGTH = 120;
const MAX_URL_LENGTH = 2048;

export type ChannelFilters = {
  name?: unknown;
  country?: unknown;
  category?: unknown;
};

export type ChannelInput = {
  name?: unknown;
  logoUrl?: unknown;
  streamUrl?: unknown;
  country?: unknown;
  categories?: unknown;
  isActive?: unknown;
};

export type PublicChannel = {
  id: string;
  name: string;
  logoUrl?: string;
  streamUrl: string;
  country: string;
  categories: string[];
  isActive: boolean;
  playlistId?: string;
  createdAt: string;
  updatedAt: string;
};

export type ValidatedChannelUpdate = {
  name?: string;
  logoUrl?: string;
  streamUrl?: string;
  country?: string;
  categories?: string[];
  isActive?: boolean;
};

export type ValidatedChannelCreate = {
  name: string;
  logoUrl?: string;
  streamUrl: string;
  country: string;
  categories: string[];
  isActive: boolean;
};

function toPublicChannel(channel: ChannelDoc): PublicChannel {
  return {
    id: channel._id.toString(),
    name: channel.name,
    logoUrl: channel.logoUrl ?? undefined,
    streamUrl: channel.streamUrl,
    country: channel.country,
    categories: [...channel.categories],
    isActive: channel.isActive,
    playlistId: channel.playlistId ? channel.playlistId.toString() : undefined,
    createdAt: channel.createdAt.toISOString(),
    updatedAt: channel.updatedAt.toISOString(),
  };
}

/** Escapa los caracteres especiales para usar el texto como regex literal. */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readOptionalString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Traduce los filtros de query string a un filtro de Mongoose. Los filtros son
 * combinables (AND) y `name` busca sin distinguir mayúsculas ni como patrón.
 */
export function buildChannelFilter(filters: ChannelFilters): Record<string, unknown> {
  const query: Record<string, unknown> = { isActive: true };

  const name = readOptionalString(filters.name);
  if (name.length > 0) {
    query.name = { $regex: escapeRegExp(name), $options: 'i' };
  }

  const country = readOptionalString(filters.country);
  if (country.length > 0) {
    query.country = { $regex: `^${escapeRegExp(country)}$`, $options: 'i' };
  }

  const category = readOptionalString(filters.category);
  if (category.length > 0) {
    query.categories = { $regex: `^${escapeRegExp(category)}$`, $options: 'i' };
  }

  return query;
}

/** Lista los canales activos que cumplen los filtros. */
export async function listChannels(filters: ChannelFilters): Promise<PublicChannel[]> {
  const channels = await Channel.find(buildChannelFilter(filters)).sort({ name: 1 }).exec();
  return channels.map(toPublicChannel);
}

async function findActiveChannelById(id: unknown): Promise<ChannelDoc> {
  if (typeof id !== 'string' || !isValidObjectId(id)) {
    throw new NotFoundError('Canal no encontrado.');
  }
  const channel = await Channel.findOne({ _id: id, isActive: true }).exec();
  if (!channel) {
    throw new NotFoundError('Canal no encontrado.');
  }
  return channel;
}

/** Devuelve un canal activo por id; 404 si no existe o está desactivado. */
export async function getChannelById(id: unknown): Promise<PublicChannel> {
  const channel = await findActiveChannelById(id);
  return toPublicChannel(channel);
}

function validateRequiredString(
  fields: Record<string, string>,
  key: string,
  value: unknown,
  maxLength: number,
): string {
  const text = readOptionalString(value);
  if (text.length === 0) {
    fields[key] = 'Este campo es obligatorio.';
  } else if (text.length > maxLength) {
    fields[key] = `No puede superar ${maxLength} caracteres.`;
  }
  return text;
}

function validateOptionalUrl(
  fields: Record<string, string>,
  key: string,
  value: unknown,
): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.length === 0 || text.length > MAX_URL_LENGTH) {
    fields[key] = 'La URL no es válida.';
    return undefined;
  }
  return text;
}

function validateCategories(fields: Record<string, string>, value: unknown): string[] {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    fields.categories = 'Las categorías deben ser una lista de textos.';
    return [];
  }
  const categories: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') {
      fields.categories = 'Las categorías deben ser una lista de textos.';
      return [];
    }
    const text = item.trim();
    if (text.length > 0 && !categories.includes(text)) {
      categories.push(text);
    }
  }
  return categories;
}

function validateIsActive(fields: Record<string, string>, value: unknown): boolean {
  if (value === undefined) {
    return true;
  }
  if (typeof value !== 'boolean') {
    fields.isActive = 'El estado debe ser booleano.';
    return true;
  }
  return value;
}

function collectInvalidInput(fields: Record<string, string>): void {
  if (Object.keys(fields).length > 0) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Datos del canal inválidos.', { fields });
  }
}

/**
 * Valida el cuerpo de creación. Los campos obligatorios del modelo son `name`,
 * `streamUrl` y `country`.
 */
export function validateCreateInput(body: ChannelInput): ValidatedChannelCreate {
  const fields: Record<string, string> = {};

  const name = validateRequiredString(fields, 'name', body.name, MAX_NAME_LENGTH);
  const streamUrl = validateRequiredString(fields, 'streamUrl', body.streamUrl, MAX_URL_LENGTH);
  const country = validateRequiredString(fields, 'country', body.country, MAX_NAME_LENGTH);
  const logoUrl = validateOptionalUrl(fields, 'logoUrl', body.logoUrl);
  const categories = validateCategories(fields, body.categories);
  const isActive = validateIsActive(fields, body.isActive);

  collectInvalidInput(fields);

  return { name, logoUrl, streamUrl, country, categories, isActive };
}

/** Valida el cuerpo de actualización: solo aplica los campos enviados. */
export function validateUpdateInput(body: ChannelInput): ValidatedChannelUpdate {
  const fields: Record<string, string> = {};
  const update: ValidatedChannelUpdate = {};

  if (body.name !== undefined) {
    update.name = validateRequiredString(fields, 'name', body.name, MAX_NAME_LENGTH);
  }
  if (body.streamUrl !== undefined) {
    update.streamUrl = validateRequiredString(fields, 'streamUrl', body.streamUrl, MAX_URL_LENGTH);
  }
  if (body.country !== undefined) {
    update.country = validateRequiredString(fields, 'country', body.country, MAX_NAME_LENGTH);
  }
  if (body.logoUrl !== undefined) {
    update.logoUrl = validateOptionalUrl(fields, 'logoUrl', body.logoUrl);
  }
  if (body.categories !== undefined) {
    update.categories = validateCategories(fields, body.categories);
  }
  if (body.isActive !== undefined) {
    update.isActive = validateIsActive(fields, body.isActive);
  }

  collectInvalidInput(fields);

  return update;
}

/** Detecta el error de clave duplicada (11000) de Mongo. */
function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 11000
  );
}

/** Crea un canal del catálogo. */
export async function createChannel(body: ChannelInput): Promise<PublicChannel> {
  const input = validateCreateInput(body);
  try {
    const channel = await Channel.create(input);
    return toPublicChannel(channel);
  } catch (error) {
    // Índice único concurrente: 409 en vez de 500.
    if (isDuplicateKeyError(error)) {
      throw new HttpError(409, 'CHANNEL_CONFLICT', 'El canal ya existe.');
    }
    throw error;
  }
}

/** Actualiza un canal activo; 404 si no existe o está desactivado. */
export async function updateChannel(id: unknown, body: ChannelInput): Promise<PublicChannel> {
  const channel = await findActiveChannelById(id);
  const update = validateUpdateInput(body);

  Object.assign(channel, update);
  await channel.save();

  return toPublicChannel(channel);
}

/**
 * Desactiva un canal (borrado lógico). Se conserva el documento para no romper
 * referencias de favoritos e historial.
 */
export async function deleteChannel(id: unknown): Promise<void> {
  if (typeof id !== 'string' || !isValidObjectId(id)) {
    throw new NotFoundError('Canal no encontrado.');
  }
  const result = await Channel.updateOne(
    { _id: new Types.ObjectId(id), isActive: true },
    { isActive: false },
  ).exec();
  if (result.matchedCount === 0) {
    throw new NotFoundError('Canal no encontrado.');
  }
}
