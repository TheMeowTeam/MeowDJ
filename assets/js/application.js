var room;
var player;

/**
 * Room class
 */
function Room() {

  var roomId = local.roomId;
  var initialized = false;

  this.loadPlayer = loadPlayer;
  this.enableChat = enableChat;

  /**
   * Enable room's player
   */
  function loadPlayer(player) {
    if (initialized)
      return;

    io.socket.post('/' + roomId + '/subscribe', {
      roomId: roomId
    }, function (resData) {
      if (resData.result == "ok") {
        loadPlayerForContent(player, resData.player);
      }
    });

    // Video Listener
    // FIXME: May produce error if player is undefined
    io.socket.on('playlistChanges', function (data) {
      loadPlayerForContent(player, data)
    });

    initialized = true;
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
   * Enable room's chat
   */
  function enableChat() {
    io.socket.on('chat', function (message) {
      $('.chat .messages').append($('<li>').append($('<b>').text(message.username + ": ")).append($('<span>').text(message.message)));
      $('.chat .messages').animate({scrollTop: $(document).height()}, "slow");
    });

    $('.chat form').submit(function () {
      var textbox = $('#message');

      if (!textbox.val())
        return false;

      io.socket.post('/' + roomId + '/chat', {
        roomId: roomId,
        message: textbox.val()
      });

      textbox.val('');

      return false;
    });
    console.log("Listening chat system")
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
        room.loadPlayer(event.target);
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
    room.enableChat();
  }

  var resize = function () {
    $('.chat .messages').css('height', $(window).height() - 34);
  };

  $(window).resize(resize);
  resize();

});
