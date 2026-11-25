/**
 * Modelo `Playlist`: origen M3U importado por el administrador.
 *
 * `sourceUrl` es único para que la re-sincronización pueda ser idempotente.
 */

import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const playlistSchema = new Schema(
  {
    name: { type: String, required: true },
    sourceUrl: { type: String, required: true },
    lastSyncedAt: { type: Date },
    channelCount: { type: Number, default: 0, required: true },
  },
  { timestamps: true },
);

playlistSchema.index({ sourceUrl: 1 }, { unique: true });

export type PlaylistDoc = HydratedDocument<InferSchemaType<typeof playlistSchema>>;
export type PlaylistInput = InferSchemaType<typeof playlistSchema>;

export const Playlist = model('Playlist', playlistSchema);
