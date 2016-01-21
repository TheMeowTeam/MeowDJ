/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {



  /**
   * `UserController.welcome()`
   *
   * Fired when a user wants to load the welcome page
   */
  welcome: function (req, res) {

    var data = {
      title: 'Welcome to Meow.DJ!',
      page: 'welcome',
      user: req.session.user
    };

    if (req.flash('error')) {
      data.error = req.flash('error');
    }

    if (req.session.user.tos == true) {
      return res.redirect('/');
    }

    if (req.flash('sent')) {
      data.sent = req.flash('sent');
    }

    return res.view('user/welcome', {data: data});
  },



  /**
   * `UserController.processWelcome()`
   *
   * Fired when a user send the welcome form
   */
  processWelcome: function (req, res) {

    var username = req.param('username');
    var email = req.param('email');
    var gender = req.param('gender');
    var newsletter = req.param('newsletter');

    if (req.session.user.tos == true) {
      return res.redirect('/');
    }

    User.findOne({
      email: req.session.user.email
    }, function (err, user) {

      if (err || !user) {
        return res.serverError(err);
      }

      User.update({
        email: req.session.user.email
      }, {
        username: username,
        email: email,
        gender: gender,
        newsletter: newsletter,
        tos: true
      }, function (err, user) {

        if (err || !user) {
          return res.serverError(err);
        }

        return res.redirect('/');
      });
    });
  }
};

