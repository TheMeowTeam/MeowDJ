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
    else if (req.session.user.activation_token == 'activated') {
      data.error = 'ALREADY_ACTIVATED';
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
      return res.redirect('/activate');
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

        return res.redirect('/');
      });
    });
  }
};

