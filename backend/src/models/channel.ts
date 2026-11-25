/**
 * Modelo `Channel`: canal de TV del catálogo.
 *
 * `streamUrl` apunta al manifiesto HLS que reproduce el cliente. El canal
 * puede pertenecer a una playlist importada desde M3U.
 */

import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const { Types } = Schema;

const channelSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    logoUrl: { type: String },
    streamUrl: { type: String, required: true },
    country: { type: String, required: true, index: true },
    categories: { type: [String], default: [], index: true },
    isActive: { type: Boolean, default: true, required: true },
    playlistId: { type: Types.ObjectId, ref: 'Playlist', index: true },
  },
  { timestamps: true },
);

export type ChannelDoc = HydratedDocument<InferSchemaType<typeof channelSchema>>;
export type ChannelInput = InferSchemaType<typeof channelSchema>;

export const Channel = model('Channel', channelSchema);
