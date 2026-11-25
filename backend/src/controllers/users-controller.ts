/**
 * Controladores de `/api/users` (solo administradores).
 *
 * - La lectura nunca expone `passwordHash`.
 * - La actualización solo toca `displayName`, `role` e `isActive`.
 * - El borrado es lógico (`isActive: false`).
 */

import type { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';

import { HttpError, NotFoundError } from '../errors/errors.js';
import { User, type UserDoc } from '../models/index.js';

const MAX_DISPLAY_NAME_LENGTH = 120;

export type PublicUser = {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UserPatchInput = {
  displayName?: unknown;
  role?: unknown;
  isActive?: unknown;
};

function toPublicUser(user: UserDoc): PublicUser {
  return {
    id: user._id.toString(),
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

function findUser(id: unknown): Promise<UserDoc | null> {
  if (typeof id !== 'string' || !isValidObjectId(id)) {
    throw new NotFoundError('Usuario no encontrado.');
  }
  return User.findById(id).exec();
}

function validatePatch(body: UserPatchInput): {
  displayName?: string;
  role?: 'user' | 'admin';
  isActive?: boolean;
} {
  const fields: Record<string, string> = {};
  const update: { displayName?: string; role?: 'user' | 'admin'; isActive?: boolean } = {};

  if (body.displayName !== undefined) {
    const text = typeof body.displayName === 'string' ? body.displayName.trim() : '';
    if (text.length === 0 || text.length > MAX_DISPLAY_NAME_LENGTH) {
      fields.displayName = 'El nombre no es válido.';
    } else {
      update.displayName = text;
    }
  }

  if (body.role !== undefined) {
    if (body.role !== 'user' && body.role !== 'admin') {
      fields.role = 'El rol no es válido.';
    } else {
      update.role = body.role;
    }
  }

  if (body.isActive !== undefined) {
    if (typeof body.isActive !== 'boolean') {
      fields.isActive = 'El estado debe ser booleano.';
    } else {
      update.isActive = body.isActive;
    }
  }

  if (Object.keys(fields).length > 0) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Datos del usuario inválidos.', { fields });
  }

  return update;
}

/** Lista todos los usuarios sin datos sensibles. */
export async function list(_req: Request, res: Response): Promise<void> {
  const users = await User.find().sort({ email: 1 }).exec();
  res.json({ data: users.map(toPublicUser) });
}

/** Devuelve un usuario por id; 404 si no existe. */
export async function getOne(req: Request, res: Response): Promise<void> {
  const user = await findUser(req.params.id);
  if (!user) {
    throw new NotFoundError('Usuario no encontrado.');
  }
  res.json({ user: toPublicUser(user) });
}

/** Actualiza `displayName`, `role` e `isActive` de un usuario. */
export async function update(req: Request, res: Response): Promise<void> {
  const user = await findUser(req.params.id);
  if (!user) {
    throw new NotFoundError('Usuario no encontrado.');
  }
  const updateData = validatePatch(req.body as UserPatchInput);

  Object.assign(user, updateData);
  await user.save();

  res.json({ user: toPublicUser(user) });
}

/** Desactiva un usuario (borrado lógico). */
export async function remove(req: Request, res: Response): Promise<void> {
  const user = await findUser(req.params.id);
  if (!user) {
    throw new NotFoundError('Usuario no encontrado.');
  }
  user.isActive = false;
  await user.save();
  res.status(204).send();
}
