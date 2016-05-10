/**
 * WaitingRoom.js - Runtime playlist data
 * @description :: WaitingRoom5 model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  connection: 'temporary',
  migrate: 'drop',
  autoUpdatedAt: false,
  attributes: {
    roomID: {type: 'string', required: true},
    userID: {type: 'integer', required: true},
    cacheID: {type: 'integer', required: true}
  }
}
