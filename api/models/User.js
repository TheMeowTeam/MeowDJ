/**
 * User.js
 *
 * @description :: User model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {

  attributes: {
    username: {type: 'string', unique: true, required: true},
    email: {type: 'email', unique: true, required: true},
    rank: {type: 'string', enum: ['basic', 'donor', 'staff', 'admin']},
    birthdate: {type: 'date'},
    gender: {type: 'string', enum: ['male', 'female']},
    newsletter: {type: 'boolean'},
    tos: {type: 'boolean', defaultsTo: false},
    passports: {collection: 'Passport', via: 'user'}
  }
};
