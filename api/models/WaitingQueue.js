/**
 * WaitingRoom.js - Runtime playlist data
 * TODO: use a separate Waterline connector
 * @description :: Room model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
module.exports = {
  migrate: 'drop',
  autoUpdatedAt: false,
  attributes: {
    roomID: {type: 'string', required: true},
    userID: {type: 'integer', required: true},
    type: {type: 'string', required: true},
    cacheID: {type: 'integer', required: true}
  }
}
