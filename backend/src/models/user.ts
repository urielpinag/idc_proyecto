/**
 * Modelo `User`: cuenta de la plataforma.
 *
 * El correo se normaliza a minúsculas y sin espacios para que el índice único
 * impida duplicados por diferencias de capitalización.
 */

import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    displayName: { type: String, required: true },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      required: true,
    },
    isActive: { type: Boolean, default: true, required: true },
  },
  { timestamps: true },
);

userSchema.index({ email: 1 }, { unique: true });

export type UserDoc = HydratedDocument<InferSchemaType<typeof userSchema>>;
export type UserInput = InferSchemaType<typeof userSchema>;

export const User = model('User', userSchema);
