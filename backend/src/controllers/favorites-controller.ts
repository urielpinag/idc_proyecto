/**
 * Controladores de `/api/favorites` (usuario autenticado).
 *
 * El dueño del favorito siempre sale de `req.user.id`; nunca del cuerpo.
 */

import type { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';

import { HttpError, NotFoundError } from '../errors/errors.js';
import { Channel, Favorite } from '../models/index.js';

type ChannelLean = {
  _id: unknown;
  name: string;
  logoUrl?: string;
  streamUrl: string;
  country: string;
  categories?: string[];
  isActive: boolean;
};

function currentUserId(req: Request): string {
  if (!req.user) {
    throw new HttpError(401, 'UNAUTHORIZED', 'Autenticación requerida.');
  }
  return req.user.id;
}

/** Lista los favoritos del usuario con el canal poblado (básico). */
export async function list(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);
  const favorites = await Favorite.find({ userId })
    .populate<{ channelId: ChannelLean | null }>('channelId', 'name logoUrl country categories isActive')
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  const data = favorites.map((favorite) => ({
    id: String(favorite._id),
    channel: favorite.channelId,
    createdAt: favorite.createdAt.toISOString(),
  }));

  res.json({ data });
}

/** Añade un canal activo a los favoritos del usuario. */
export async function create(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);
  const body = req.body as { channelId?: unknown };
  if (typeof body.channelId !== 'string' || !isValidObjectId(body.channelId)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Datos del favorito inválidos.', {
      fields: { channelId: 'Identificador de canal inválido.' },
    });
  }

  const channel = await Channel.findOne({ _id: body.channelId, isActive: true }).exec();
  if (!channel) {
    throw new NotFoundError('Canal no encontrado.');
  }

  const existing = await Favorite.findOne({ userId, channelId: body.channelId }).exec();
  if (existing) {
    throw new HttpError(409, 'FAVORITE_CONFLICT', 'El canal ya está en favoritos.');
  }

  const favorite = await Favorite.create({ userId, channelId: body.channelId });
  res.status(201).json({ favorite: { id: favorite._id.toString(), channelId: body.channelId } });
}

/** Elimina un favorito propio; 404 si no existe. */
export async function remove(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);
  const { channelId } = req.params;
  if (!isValidObjectId(channelId)) {
    throw new NotFoundError('Favorito no encontrado.');
  }
  const result = await Favorite.deleteOne({ userId, channelId }).exec();
  if (result.deletedCount === 0) {
    throw new NotFoundError('Favorito no encontrado.');
  }
  res.status(204).send();
}
