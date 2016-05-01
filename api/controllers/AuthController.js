/**
 * AuthController
 *
 * @description :: Server-side logic for managing authentication
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

function guid() {

  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }

  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

module.exports = {


  /**
   * `AuthController.callback()`
   *
   * Fired when a user logins to the authentication
   * application
   */
  callback: function (req, res) {
    if (!req.param('transactionID') || !req.param('guid') || !req.param('userId') || !req.param('userUsername') || !req.param('userRank')) {
      return res.json(400, {
        code: 400,
        message: 'Bad request'
      });
    }

    var transactionID = req.param('transactionID');
    var guid = req.param('guid');
    AuthCache.findOne({guid: guid}, function (err, obj) {
      if (err || !obj)
        return res.json(403, {
          code: 403,
          message: 'Access denied'
        });
      AuthCache.update({id: obj.id}, {transactionID: transactionID}, function (err, objUpdated) {
        if (err || !obj)
          return res.json(503, {
            code: 503,
            message: 'Internal Server Error'
          });
        sails.sockets.broadcast(guid, 'login-callback', {
          user: {
            id: req.param('userId'),
            username: req.param('userUsername'),
            rank: req.param('userRank'),
            guid: req.param('guid'),
            transactionID: req.param('transactionID')
          }
        });
        return res.json({result: 'ok'});
      })
    })
  },


  /**
   * `AuthController.subscribe()`
   *
   * Subscribe new user to listen the authentication
   */
  subscribe: function (req, res) {
    AuthCache.create({guid: guid()}, function (err, obj) {
      if (!err) {
        sails.sockets.join(req.socket, obj.guid);
        return res.json({result: 'ok', guid: obj.guid});
      }
      return res.json({result: 'error'});
    })
  },


  /**
   * `AuthController.authenticate()`
   *
   * Subscribe new user to listen the authentication
   */
  authenticate: function (req, res) {
    // FIXME: Implement token system in auth server to avoid security issues
    if (!req.param('transactionID') || !req.param('guid') || !req.param('userId') || !req.param('userUsername') || !req.param('userRank')) {
      return res.json(400, {
        code: 400,
        message: 'Bad request'
      });
    }

    AuthCache.findOne({transactionID: req.param('transactionID')}, function (err, obj) {
      if (err || !obj)
        return res.json(403, {
          code: 403,
          message: 'Access denied'
        });
      sails.log.debug("Destorying transaction " + obj.transactionID)
      AuthCache.destroy({id: obj.id});
      req.session.authenticated = true;
      req.session.user = {
        id: req.param('userId'),
        username: req.param('userUsername'),
        rank: req.param('userRank')
      };
      return res.redirect('/');
    })
  }

};

