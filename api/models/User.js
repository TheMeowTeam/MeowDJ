module.exports = {
  attributes: {
    username  : { type: 'string', unique: true },
    email     : { type: 'email',  unique: true },
    rank      : { type: 'string', defaultsTo: 'basic', enum: [ 'basic', 'donor', 'staff', 'admin' ] },
    passports : { collection: 'Passport', via: 'user' }
  }
};
