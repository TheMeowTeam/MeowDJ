/**
 * AuthCache.js - auth cache for login
 * @description :: AuthCache model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  connection: 'temporary',
  migrate: 'drop',
  autoUpdatedAt: false,
  attributes: {
    guid: {type: 'string', required: true},
    transactionID: {type: 'string'}
  }
}
