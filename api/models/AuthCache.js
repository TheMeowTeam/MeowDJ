/**
 * AuthCache.js - auth cache for login
 * TODO: use a separate Waterline connector
 * @description :: WaitingRoom5 model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  migrate: 'drop',
  autoUpdatedAt: false,
  attributes: {
    guid: {type: 'string', required: true},
    token: {type: 'string'}
  }
}
