/**
 * Controladores de `/api/channels`.
 *
 * La lectura (`GET`) es pública y solo expone canales activos; las mutaciones
 * (`POST`, `PUT`, `DELETE`) son administrativas.
 */

import type { Request, Response } from 'express';

import {
  createChannel,
  deleteChannel,
  getChannelById,
  listChannels,
  updateChannel,
} from '../services/channels-service.js';

export async function list(req: Request, res: Response): Promise<void> {
  const data = await listChannels({
    name: req.query.name,
    country: req.query.country,
    category: req.query.category,
  });
  res.json({ data });
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const channel = await getChannelById(req.params.id);
  res.json({ channel });
}

export async function create(req: Request, res: Response): Promise<void> {
  const channel = await createChannel(req.body as Record<string, unknown>);
  res.status(201).json({ channel });
}

export async function update(req: Request, res: Response): Promise<void> {
  const channel = await updateChannel(req.params.id, req.body as Record<string, unknown>);
  res.json({ channel });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await deleteChannel(req.params.id);
  res.status(204).send();
}
