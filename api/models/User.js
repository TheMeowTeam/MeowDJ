/**
 * User.js
 *
 * @description :: User model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  connection: 'persistent',
  attributes: {
    authID: {type: 'integer', unique: true, required: true},
    username: {type: 'string', unique: true, required: true},
    rank: {type: 'string', enum: ['basic', 'donor', 'staff', 'admin']}
  }
};
