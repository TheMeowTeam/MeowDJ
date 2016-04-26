var transporter = null;
var local = null;
try {
  sails.log.info("Initializing Email Transport...")
  local = require('../../config/local.js');
  transporter = require('nodemailer').createTransport(local.nodemailer.transport);
  sails.log.info("Email Transport is enabled!")
}
catch (e) {
  sails.log.warn("Something when wrong during Email Service initialization!");
  sails.log.warn("Maybe your config/local.js is incorrect?");
  sails.log.warn("Email Transport is disabled!")
}

module.exports = {

  isTransportEnabled: function() {
    return transporter != null;
  },
  sendEmail: function(options, callback) {
    if (transporter == null)
      return {status: 'error', error: 'MAIL_TRANSPORT_DISABLED'};
    options['from'] = local.nodemailer.as;
    transporter.sendMail(options, callback);
    return {status: 'ok'};
  }
};
