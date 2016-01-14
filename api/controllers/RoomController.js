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

    var roomId = req.param('room');

    return res.view('room/room', {
      args: {
        title: roomId,
        page: 'room',
        roomId: roomId
      }
    });
  },


  /**
   * `RoomController.subscribe()`
   *
   * Subscribe new user to the room
   */
  subscribe: function(req, res) {

    var roomId = req.param('roomId');

    sails.sockets.join(req.socket, roomId);

    return res.json({ result: 'ok' });
  },


  /**
   * `RoomController.chat()`
   *
   * Fired when someone sent a chat message
   */
  chat: function(req, res) {

    var roomId = req.param('roomId');
    var message = req.param('message');

    sails.sockets.broadcast(roomId, 'chat', message);

    return res.json({ result: 'ok' });
  }
};

