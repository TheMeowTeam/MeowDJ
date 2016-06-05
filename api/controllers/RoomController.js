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

      var data = {
        title: 'Create a room',
        page: 'create-room'
      };

      if (room) {
        data.error = 'ALREADY_HAVE_ROOM';
        data.go = room.identifier;
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

    var roomId = req.param('room');

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

    var roomId = req.param('room');

    Room.findOne({
      identifier: roomId
    }, function (err, room) {

      if (err || !room) {
        return res.json({result: 'error'});
      }

      sails.sockets.join(req.socket, roomId);

      var media = null;
      if (ActiveMediaService.isPlaying(roomId)) {
        media = ActiveMediaService.getMedia(roomId).content;
        media.serverTime = Date.now();
      }

      return res.json({
        result: 'ok',
        motd: room.motd,
        media: media
      });
    });
  },

  addToWaitingQueue: function (req, res) {
    var roomId = req.param('room');
    var url = req.param('url');
    var user = req.session.user;

    Room.findOne({
      identifier: roomId
    }, function (err, room) {

      if (err || !room) {
        return res.json({result: 'error'});
      }
      var content = MediaService.parseURL(url);
      if (content == null)
        return res.json({result: 'error', reason: 'INVALID_CONTENT_TYPE'})
      else if (content.contentID.indexOf("sets") > -1)
        return res.json({result: 'error', reason: 'SOUNDCLOUD_SETS_DISABLED'})

      // Caching system search
      MediaCache.findOne({contentID: content.contentID}, function (err, cacheEntry) {
        // Entry not found, cache need to be generated
        if (err || !cacheEntry) {
          MediaService.fetchContentData(content, user, roomId, url)
        }
        else {
          ActiveMediaService.processAddWaitingQueue(roomId, user, cacheEntry);
        }

        return res.json({result: 'ok'})
      })
    });
  },


  /**
   * `RoomController.chat()`
   *
   * Fired when someone sent a chat message
   */
  chat: function (req, res) {

    var roomId = req.param('room');
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

    var roomId = req.param('room');
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
  },
  /**
   * Response to ping
   */
  getMediaTime: function (req, res) {
    var position = -1;
    var media = ActiveMediaService.getMedia(req.param('room'));
    if (media != null)
      position = parseInt((media.content.endTime - Date.now()) / 1000);
    return res.json({result: 'ok', position: position})
  }
};

