/**
 * AuthController
 *
 * @description :: Server-side logic for managing authentication
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {


  /**
   * `AuthController.callback()`
   *
   * Fired when a user logins to the authentication
   * application
   */
  callback: function (req, res) {

    if (!req.param('guid') || !req.param('token'))
      return;

    var guid = req.param('guid');
    var token = req.param('token');

    // TODO: Load the user into the session

    sails.sockets.broadcast(guid, 'login-callback', { result: 'ok' });

    return res.json({ result: 'ok' });
  },


  /**
   * `AuthController.subscribe()`
   *
   * Subscribe new user to listen the authentication
   */
  subscribe: function (req, res) {

    sails.sockets.join(req.socket, req.param('guid'));
    return res.json({ result: 'ok' });
  }

};

