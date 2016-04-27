var room;
var player;

/**
 * Room class
 */
function Room() {

  var room = local.room;
  var messages = $('.chat .messages');
  var subscribeResponse = null;
  var initialized = false;

  this.initialize = initialize;
  this.initializePlayer = initializePlayer;

  /**
   * Initialize room's components
   */
  function initialize() {

    if (initialized)
      return;

    io.socket.post('/' + room.identifier + '/subscribe', {
      roomId: room.identifier
    }, function (response) {

      if (response.result != 'ok') {
        writeChatMessage('System', 'An error occured when loading this room, please try again later or contact a staff member!', 'system');
        return;
      }

      subscribeResponse = response;

      initializeChat(response);
      $('.playlist form').submit(function () {
        var textbox = $('#url');

        if (!textbox.val())
          return false
        io.socket.post('/' + room.identifier + '/playlist/add', {
          roomId: room.identifier,
          url: textbox.val()
        })
        textbox.val('');
        return false;
      });
    });

    initialized = true;
  }

  /**
   * Initialize room's player
   */
  function initializePlayer(player) {

    //loadPlayerForContent(player, subscribeResponse.player);

    // FIXME: May produce error if player is undefined
    io.socket.on('playlist/update', function (data) {
      console.dir(data)
      loadPlayerForContent(player, data.player)
    });
  }

  /**
   * Initialize room's chat
   */
  function initializeChat(response) {

    $('.chat form').submit(function () {
      var textbox = $('#message');

      if (!textbox.val())
        return false;

      io.socket.post('/' + room.identifier + '/chat', {
        roomId: room.identifier,
        message: textbox.val()
      });

      textbox.val('');

      return false;
    });

    io.socket.on('chat', function (data) {
      writeChatMessage(data.username, data.message);
    });

    writeChatMessage(room.name, response.motd);
  }

  /**
   * Load a given Youtube video ID on the player
   */
  function loadPlayerForContent(player, playerData) {
    if (playerData.type == "yt") {
      player.loadVideoById(playerData.data);
    }
  }

  /**
   * Write a message in the room's chat
   */
  function writeChatMessage(sender, message, style) {

    var messageEntry = $('<li>');

    if (style) {
      messageEntry.addClass('chat-' + style);
    }

    messages.append(messageEntry.append($('<b>').text(sender + ": ")).append($('<span>').text(message)));
    messages.animate({scrollTop: $(document).height()}, "slow");
  }
}

function onYouTubeIframeAPIReady() {

  player = new YT.Player('player', {
    height: '390',
    width: '640',
    videoId: '',

    playerVars: {
      controls: 0,
      disablekb: 1,
      rel: 0,
      fs: 0,
      iv_load_policy: 3,
      showinfo: 0
    },

    events: {
      'onReady': function (event) {
        room.initializePlayer(event.target);
        event.target.playVideo();
      },

      'onStateChange': function (event) {
        if (event.data == YT.PlayerState.PAUSED) {
          event.target.playVideo();
        }
      }
    }
  });
}

$(document).ready(function () {

  if (local.page == 'room') {
    room = new Room();
    room.initialize();
  }

  var resize = function () {
    $('.chat .messages').css('height', $(window).height() - 34);
  };

  $(window).resize(resize);
  resize();
});
