/**
 * Modelo `WatchHistory`: registro de reproducción de un canal por usuario.
 *
 * El índice compuesto `(userId, watchedAt)` sirve el historial reciente.
 */

import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const { Types } = Schema;

const watchHistorySchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true },
    channelId: { type: Types.ObjectId, ref: 'Channel', required: true },
    watchedAt: { type: Date, default: Date.now, required: true },
    durationSeconds: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

watchHistorySchema.index({ userId: 1, watchedAt: -1 });

export type WatchHistoryDoc = HydratedDocument<InferSchemaType<typeof watchHistorySchema>>;
export type WatchHistoryInput = InferSchemaType<typeof watchHistorySchema>;

export const WatchHistory = model('WatchHistory', watchHistorySchema);
