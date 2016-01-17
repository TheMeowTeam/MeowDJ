/**
 * RoomController
 *
 * @description :: Server-side logic for managing rooms
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {


  /**
   * `RoomController.create()`
   *
   * Fired when a user wants to create his room
   */
  create: function (req, res) {

    Room.findOne({
      owner: req.session.user.id
    }, function (err, room) {

      if (err) {
        return res.serverError(err);
      }

      data = {
        title: 'Create a room',
        page: 'create-room'
      };

      if (room) {
        data.error = 'ALREADY_HAVE_ROOM';
      }

      return res.view('room/create', {data: data});
    });
  },



  /**
   * `RoomController.processCreate()`
   *
   * Fired when a user send the creation form of his room
   */
  processCreate: function (req, res) {

    Room.findOne({
      owner: req.session.user.id
    }, function (err, room) {

      if (err) {
        return res.serverError(err);
      }

      if (room) {
        return res.redirect('/create');
      }

      var roomName = req.param('name');

      Room.create({
        identifier: Room.formatIdentifier(roomName),
        name: roomName,
        owner: req.session.user.id
      }, function (err, room) {

        if (err) {
          return res.serverError(err);
        }
        else if (!room) {
          return res.serverError('Failed to create the room!');
        }

        return res.redirect('/' + room.identifier);
      });
    });
  },



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

      if (err) {
        return res.serverError(err);
      }
      else if (!room) {
        return res.notFound();
      }

      return res.view('room/room', {
        data: {
          title: room.name,
          page: 'room',
          room: room
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
        return res.json({result: 'error'});
      }

      sails.sockets.join(req.socket, roomId);

      playerData = {
        'videoId': 'XoyO7rQBmdQ',
        'startSeconds': 5,
        'suggestedQuality': 'large'
      }; // TODO: Make the queue system

      return res.json({
        result: 'ok',

        motd: room.motd,

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
        return res.json({result: 'error'});
      }

      sails.sockets.broadcast(roomId, 'chat', {
        username: req.session.user.username,
        rank: req.session.user.rank,
        message: message
      });

      return res.json({result: 'ok'});
    });
  },



  /**
   * `RoomController.processConfiguration()`
   *
   * Fired when the room's owner edit his room
   */
  processConfiguration: function (req, res) {

    var roomId = req.param('roomId');
    var motd = req.param('motd');

    Room.findOne({
      identifier: roomId
    }, function (err, room) {

      if (err || !room) {
        return res.json({result: 'error'});
      }

      Room.update({
        identifier: roomId
      }, {
        motd: motd
      });

      sails.sockets.broadcast(roomId, 'configuration', {
        motd: motd
      });

      return res.json({result: 'ok'});
    });
  }
};

