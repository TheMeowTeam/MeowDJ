/**
 * Room.js
 *
 * @description :: Room model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {

  attributes: {
    identifier: {type: 'string', unique: true, required: true},
    name: {type: 'string', unique: true, required: true},
    owner: {type: 'integer', required: true},
    motd: {type: 'string', defaultsTo: 'Beautiful message of the day!'},
    theme: {type: 'string', defaultsTo: 'basic'},
    managers: {type: 'array', defaultsTo: []},
    moderators: {type: 'array', defaultsTo: []}
  },

  formatIdentifier: function (name) {
    return name.replace(/[^A-Za-z]/g, '').toLowerCase();
  }
};
