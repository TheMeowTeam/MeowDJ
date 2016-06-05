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
    var isOK = false;
    for (var index in sails.authentificationIPs) {
      if (req.ip.indexOf(sails.authentificationIPs[index].address) > -1)
        isOK = true;
    }
    if (!isOK) {
      sails.log.warn("Unauthorized IP detected during authenticate (IP: " + req.ip + ")")
      return res.json(403, {
        code: 403,
        message: 'Access denied'
      });
    }
    if (!req.param('transactionID') || !req.param('guid') || !req.param('authenticationUserID') || !req.param('userUsername') || !req.param('userRank')) {
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
      AuthCache.update({id: obj.id}, {transactionID: transactionID}, function (err) {
        if (err || !obj)
          return res.json(503, {
            code: 503,
            message: 'Internal Server Error'
          });
        sails.sockets.broadcast(guid, 'login-callback', {
          user: {
            id: req.param('authenticationUserID'),
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

    if (!req.param('transactionID') || !req.param('guid') || !req.param('authenticationUserID') || !req.param('userUsername') || !req.param('userRank')) {
      return res.json(400, {
        code: 400,
        message: 'Bad Request'
      });
    }

    AuthCache.findOne({transactionID: req.param('transactionID')}, function (err, obj) {
      if (err || !obj)
        return res.json(403, {
          code: 403,
          message: 'Access denied'
        });
      var id = req.param('authenticationUserID');
      var username = req.param('userUsername');
      var rank = req.param('userRank');
      User.findOrCreate({authID: id}, {authID: id, username: username, rank: rank}, function (err, user) {
        if (err || !user)
          return res.json(503, {code: 503, message: "Internal Server Error"});
        else {
          req.session.user = user;
          req.session.authenticated = true;
          return res.redirect('/');
        }
      });
      AuthCache.destroy({id: obj.id});
    })
  }

};

