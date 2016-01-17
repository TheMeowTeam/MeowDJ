/**
* User.js
*
* @description :: User model
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
    username         : { type: 'string', unique: true, required: true },
    email            : { type: 'email',  unique: true, required: true },
    rank             : { type: 'string', enum: [ 'basic', 'donor', 'staff', 'admin' ] },
    birthdate        : { type: 'date' },
    gender           : { type: 'string', enum: [ 'male', 'female'] },
    newsletter       : { type: 'boolean' },
    passports        : { collection: 'Passport', via: 'user' },
    activation_token : { type: 'string', required: true }
  },

  generateActivationToken: function () {

    var activation_token = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i=0; i < 32; i++) {
      activation_token += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return activation_token;
  },

  sendActivationEmail: function (user) {

    var local = require('../../config/local.js');
    var nodemailer = require('nodemailer');
    var transporter = nodemailer.createTransport(local.nodemailer.transport);

    var mailOptions = {
      from: local.nodemailer.as,
      to: user.email,
      subject: 'Welcome to Meow.DJ!',
      text: 'Welcome to Meow.DJ, ' + user.username + '!\n\nPlease activate your account by clicking this link:\nhttps://meow.dj/activate/' + user.activation_token + '\n\nSee you later :)\nMeow.DJ\'s team'
    };

    transporter.sendMail(mailOptions, function (err, info) {

      if (err) {
        return {status: 'error', error: err};
      }
      else {
        return {status: 'ok'};
      }
    });

    return {status: 'error', error: 'NO_MAIL_SENT'};
  }
};
