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

    return res.view('home', {
      data: {
        title: 'Home',
        page: 'home'
      }
    });
  }
};

