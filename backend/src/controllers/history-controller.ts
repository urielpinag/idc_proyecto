/**
 * Controladores de `/api/history` (usuario autenticado).
 *
 * Cada petición actúa solo sobre el historial de `req.user.id`.
 */

import type { Request, Response } from 'express';
import { isValidObjectId, Types } from 'mongoose';

import { HttpError, NotFoundError } from '../errors/errors.js';
import { Channel, WatchHistory } from '../models/index.js';

function currentUserId(req: Request): string {
  if (!req.user) {
    throw new HttpError(401, 'UNAUTHORIZED', 'Autenticación requerida.');
  }
  return req.user.id;
}

function invalid(message: string, fields: Record<string, string>): HttpError {
  return new HttpError(400, 'VALIDATION_ERROR', message, { fields });
}

/** Lista el historial propio, del registro más reciente al más antiguo. */
export async function list(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);
  const records = await WatchHistory.find({ userId }).sort({ watchedAt: -1 }).exec();
  res.json({ data: records });
}

/** Registra una reproducción del usuario en un canal activo. */
export async function record(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);
  const body = req.body as {
    channelId?: unknown;
    durationSeconds?: unknown;
    watchedAt?: unknown;
  };

  if (typeof body.channelId !== 'string' || !isValidObjectId(body.channelId)) {
    throw invalid('Datos del historial inválidos.', { channelId: 'Identificador de canal inválido.' });
  }
  if (typeof body.durationSeconds !== 'number' || !Number.isFinite(body.durationSeconds) || body.durationSeconds < 0) {
    throw invalid('Datos del historial inválidos.', {
      durationSeconds: 'La duración debe ser un número no negativo.',
    });
  }

  let watchedAt: Date | undefined;
  if (body.watchedAt !== undefined) {
    const parsed = typeof body.watchedAt === 'string' ? new Date(body.watchedAt) : new Date(Number.NaN);
    if (Number.isNaN(parsed.getTime())) {
      throw invalid('Datos del historial inválidos.', { watchedAt: 'Fecha inválida.' });
    }
    watchedAt = parsed;
  }

  const channel = await Channel.findOne({ _id: body.channelId, isActive: true }).exec();
  if (!channel) {
    throw new NotFoundError('Canal no encontrado.');
  }

  const history = await WatchHistory.create({
    userId,
    channelId: body.channelId,
    durationSeconds: body.durationSeconds,
    ...(watchedAt ? { watchedAt } : {}),
  });

  res.status(201).json({ history });
}

/** Canales más vistos por el usuario. */
export async function top(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);
  const rawLimit = req.query.limit;
  const limit = rawLimit === undefined ? 10 : Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1) {
    throw invalid('Parámetros inválidos.', { limit: 'El límite debe ser un entero positivo.' });
  }

  const data = await WatchHistory.aggregate([
    { $match: { userId: new Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$channelId',
        views: { $sum: 1 },
        lastWatchedAt: { $max: '$watchedAt' },
      },
    },
    { $sort: { views: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'channels',
        localField: '_id',
        foreignField: '_id',
        as: 'channel',
      },
    },
    { $unwind: { path: '$channel', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        channelId: '$_id',
        channel: '$channel',
        views: 1,
        lastWatchedAt: 1,
      },
    },
  ]).exec();

  res.json({ data });
}
