/**
 * Modelo `Session`: sesión de refresco emitida a un usuario.
 *
 * Solo se guarda el hash del refresh token; el token en claro nunca se persiste.
 */

import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const { Types } = Schema;

const sessionSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    refreshTokenHash: { type: String, required: true },
    userAgent: { type: String },
    ip: { type: String },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

sessionSchema.index({ refreshTokenHash: 1 }, { unique: true });

export type SessionDoc = HydratedDocument<InferSchemaType<typeof sessionSchema>>;
export type SessionInput = InferSchemaType<typeof sessionSchema>;

export const Session = model('Session', sessionSchema);
