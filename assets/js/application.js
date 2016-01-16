var player;

/**
 * Room class
 */
function Room() {

  var roomId = local.roomId;

  this.loadPlayer = loadPlayer
  this.init = false;
  this.enableChat = enableChat;

  function loadPlayerForContent(pl, playerData) {
    if (playerData.type == "yt") {
      pl.loadVideoById(playerData.data);
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

  function loadPlayer(pl) {
    if (this.init)
      return;

    io.socket.post('/' + roomId + '/subscribe', {
      roomId: roomId
    }, function (resData) {
      if (resData.result == "ok") {
        loadPlayerForContent(pl, resData.player);
      }
    });

    // Video Listener
    // FIXME: May produce error if player is undefined
    io.socket.on('playlistChanges', function (data) {
      loadPlayerForContent(pl, data)
    });
    this.init = true;
  }
}

var room;

// Init function need to be outside to be execute
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
