/**
 * ActivationController
 *
 * @description :: Server-side logic for managing accounts activation
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {


  /**
   * `ActivationController.activate()`
   *
   * Fired when a user wants to show the activation page
   */
  activate: function (req, res) {

    var data = {
      title: 'Activate your account',
      page: 'activate'
    };

    if (req.flash('error')) {
      data.error = req.flash('error');
    }

    if (req.session.user.activation_token == 'activated') {
      if (req.session.user.tos === false) {
        return res.redirect('/welcome');
      }
      else {
        return res.redirect('/');
      }
    }

    if (req.flash('sent')) {
      data.sent = req.flash('sent');
    }

    return res.view('activation/activate', {data: data});
  },



  /**
   * `ActivationController.processActivate()`
   *
   * Fired when a user send the activation form OR click
   * the link sent by email
   */
  processActivate: function (req, res) {

    var activation_token = req.param('token');

    if (!activation_token || req.session.user.activation_token == 'activated') {
      return res.redirect('/');
    }

    User.findOne({
      email: req.session.user.email,
      activation_token: activation_token
    }, function (err, user) {

      if (err) {
        return res.serverError(err);
      }

      if (!user) {
        req.flash('error', 'INCORRECT_TOKEN');
        req.flash('form', req.body);
        return res.redirect('/activate');
      }

      User.update({
        email: req.session.user.email
      }, {
        activation_token: 'activated'
      }, function (err, user) {

        if (err || !user) {
          return res.serverError(err);
        }

        return res.redirect('/welcome');
      });
    });
  },



  /**
   * `ActivationController.sendActivationEmail()`
   *
   * Fired when a user send the activation form OR click
   * the link sent by email
   */
  sendActivationEmail: function (req, res) {

    console.log('sending new mail');

    if (req.session.user.activation_token == 'activated') {
      return res.redirect('/');
    }

    var response = ActivationService.sendActivationEmail(req.session.user);

    if (response.status != 'logged' || response.status != 'activation') {
      req.flash('error', response.error);
      req.flash('form', req.body);
    }
    else {
      req.flash('sent', true);
      req.flash('form', req.body);
    }

    console.log(response);

    if (response.status == 'logged')
      return res.redirect('/login');
    return res.redirect('/activate');
  }
};

