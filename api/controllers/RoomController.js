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

    var roomId = req.param('room').toLowerCase();

    Room.findOne({
      identifier: roomId
    }, function (err, room) {

      if (err || !room) {
        return res.notFound({
          data: {
            title: '404'
          }
        });
      }

      return res.view('room/room', {
        data: {
          title: room.name,
          page: 'room',
          roomId: roomId
        }
      });
    });
  },


  /**
   * `RoomController.subscribe()`
   *
   * Subscribe new user to the room
   */
  subscribe: function (req, res) {

    var roomId = req.param('roomId');

    Room.findOne({
        identifier: roomId
      }, function (err, room) {

      if (err || !room) {
        return res.notFound({
          data: {
            title: '404'
          }
        });
      }

      sails.sockets.join(req.socket, roomId);

      playerData = {
        'videoId': 'XoyO7rQBmdQ',
        'startSeconds': 5,
        'suggestedQuality': 'large'
      }; // TODO: Make the queue system

      return res.json({
        result: 'ok',

        player: {
          type: "yt",
          data: playerData
        }
      });
    });
  },


  /**
   * `RoomController.chat()`
   *
   * Fired when someone sent a chat message
   */
  chat: function (req, res) {

    var roomId = req.param('roomId');
    var message = req.param('message');

    Room.findOne({
      identifier: roomId
    }, function (err, room) {

      if (err || !room) {
        return res.notFound({
          data: {
            title: '404'
          }
        });
      }
      
      sails.sockets.broadcast(roomId, 'chat', {
        username: req.session.user.username,
        rank: req.session.user.rank,
        message: message
      });

      return res.json({result: 'ok'});
    });
  }
};

