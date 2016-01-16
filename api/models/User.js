/**
* User.js
*
* @description :: User model
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
    username  : { type: 'string', unique: true },
    email     : { type: 'email',  unique: true },
    rank      : { type: 'string', defaultsTo: 'basic', enum: [ 'basic', 'donor', 'staff', 'admin' ] },
    passports : { collection: 'Passport', via: 'user' }
  }

};
