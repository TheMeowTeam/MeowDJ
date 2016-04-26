module.exports = {
  generateActivationToken: function () {

    var activation_token = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < 32; i++) {
      activation_token += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return activation_token;
  },
  sendActivationEmail: function (user) {
    if (!EmailService.isTransportEnabled()) {
      // Mail is disabled, no activation required
      User.update({
        email: user.email
      }, {
        activation_token: 'activated',
        tos: true
      }, function (err, user) {
        if (err != null)
          console.error(err);
      });
      return {status: 'logged'};
    }

    var mailOptions = {
      to: user.email,
      subject: 'Welcome to Meow.DJ!',
      text: 'Welcome to Meow.DJ, ' + user.username + '!\n\nPlease activate your account by clicking this link:\nhttps://meow.dj/activate/' + user.activation_token + '\n\nSee you later :)\nMeow.DJ\'s team'
    };

    EmailService.sendMail(mailOptions, function (err, info) {

      if (err) {
        return {status: 'error', error: err};
      }
      else {
        return {status: 'activate'};
      }
    });

    return {status: 'error', error: 'NO_MAIL_SENT'};
  }
}
