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

    if (!req.param('guid') || !req.param('userId') || !req.param('userUsername') || !req.param('userRank')) {
      return res.json(400, {
        code: 400,
        message: 'Bad request'
      });
    }

    var guid = req.param('guid');
    
    sails.sockets.broadcast(guid, 'login-callback', {
      user: {
        id: req.param('userId'),
        username: req.param('userUsername'),
        rank : req.param('userRank')
      }
    });

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
  },


  /**
   * `AuthController.authenticate()`
   *
   * Subscribe new user to listen the authentication
   */
  authenticate: function (req, res) {

    if (!req.param('userId') || !req.param('userUsername') || !req.param('userRank')) {
      return res.json(400, {
        code: 400,
        message: 'Bad request'
      });
    }

    req.session.authenticated = true;
    req.session.user = {
      id: req.param('userId'),
      username: req.param('userUsername'),
      rank : req.param('userRank')
    };

    return res.redirect('/');
  }

};

