/**
 * RoomController
 *
 * @description :: Server-side logic for managing rooms
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {



  /**
   * `RoomController.enter()`
   *
   * Fired when a user wants to enter a room
   */
  enter: function (req, res) {

    return res.view('room/room', {
      title: req.param('room')
    });
  }
};

