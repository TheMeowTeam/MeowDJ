/**
 * HomeController
 *
 * @description :: Server-side logic for managing home
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {


  /**
   * `HomeController.index()`
   *
   * Fired when a user wants to load the home page
   */
  index: function (req, res) {

    var data = {
      title: 'Home',
      page: 'home',
      user: req.session.user,
      authenticationHost: sails.config.authenticationHost,
      baseURL: sails.config.applicationHost
    };

    if (req.session.user) {
      Room.findOne({
        owner: req.session.user.id
      }, function (err, room) {

        if (err) {
          return res.serverError(err);
        }

        if (room) {
          data['userRoom'] = room.identifier;
        }

        return res.view('home', {data : data});
      });
    }
    else {
      return res.view('home', {data: data});
    }
  }

};

