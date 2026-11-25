/**
 * Controladores de `/api/playlists`.
 *
 * La lectura (`GET`) es pública; la importación y re-sincronización M3U
 * (`POST /sync`, con alias `POST /import`) es administrativa.
 */

import type { Request, Response } from 'express';

import { getPlaylistById, listPlaylists, syncPlaylist } from '../services/m3u-service.js';

export async function list(req: Request, res: Response): Promise<void> {
  const data = await listPlaylists();
  res.json({ data });
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const playlist = await getPlaylistById(req.params.id);
  res.json({ playlist });
}

export async function sync(req: Request, res: Response): Promise<void> {
  const result = await syncPlaylist(req.body as Record<string, unknown>);
  res.status(200).json(result);
}
