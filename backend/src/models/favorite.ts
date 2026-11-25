/**
 * Modelo `Favorite`: canal marcado como favorito por un usuario.
 *
 * El índice compuesto único evita que un usuario repita el mismo canal.
 */

import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const { Types } = Schema;

const favoriteSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true },
    channelId: { type: Types.ObjectId, ref: 'Channel', required: true },
    createdAt: { type: Date, default: Date.now, required: true },
  },
  { timestamps: true },
);

favoriteSchema.index({ userId: 1, channelId: 1 }, { unique: true });

export type FavoriteDoc = HydratedDocument<InferSchemaType<typeof favoriteSchema>>;
export type FavoriteInput = InferSchemaType<typeof favoriteSchema>;

export const Favorite = model('Favorite', favoriteSchema);
