/**
 * Barrel de modelos Mongoose de TV Hub.
 *
 * Importar este módulo registra los seis modelos en la conexión de Mongoose.
 */

export { User, type UserDoc, type UserInput } from './user.js';
export { Session, type SessionDoc, type SessionInput } from './session.js';
export { Channel, type ChannelDoc, type ChannelInput } from './channel.js';
export { Playlist, type PlaylistDoc, type PlaylistInput } from './playlist.js';
export { Favorite, type FavoriteDoc, type FavoriteInput } from './favorite.js';
export { WatchHistory, type WatchHistoryDoc, type WatchHistoryInput } from './watchHistory.js';
