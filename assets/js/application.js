if (!Date.now) {
  Date.now = function () {
    return new Date().getTime();
  }
}

var room;
var player;
var volume = 100;

/**
 * Room class
 */
function Room() {

  var room = local.room;
  var messages = $('.chat .messages');
  var subscribeResponse = null;
  var initialized = false;
  var timer = null;
  var mediaData = null;

  this.initialize = initialize;
  this.initializePlayer = initializePlayer;
  this.loadPlayerForContent = loadPlayerForContent;

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
      this.subscribeResponse = subscribeResponse;

      initializeChat(response);
      initializePlayer();

      $('.media-select').click(function () {
        $('#media-queue').css("display", "table");
      });
      $('.volume').change(function () {
        var newValue = this.value;
        $('.volume-label').text(newValue + "%");
        volume = newValue;
        if (player != null)
          player.setVolume(volume);
      });

      $(document).keypress(function (event) {
        var keycode = (event.keyCode ? event.keyCode : event.which);

        // Force quit the modal
        if (keycode == 27)
          $('#media-queue').css("display", "none")
      });
      $('#media-queue form').submit(function () {
        var textbox = $('#url');

        if (!textbox.val())
          return false
        io.socket.post('/' + room.identifier + '/playlist/add', {
          roomId: room.identifier,
          url: textbox.val()
        })
        textbox.val('');
        $('#media-queue').css("display", "none");
        return false;
      });
      loadPlayerForContent(response.media)
    });
    initialized = true;
  }

  function fetchSubResponse() {
    var response = subscribeResponse;
    return response;
  }

  /**
   * Initialize room's player
   */
  function initializePlayer(player) {

    io.socket.on('media/update', function (data) {
      loadPlayerForContent(data)
    });
  }

  /**
   * Initialize room's chat
   */
  function initializeChat(response) {

    $('.chat-box form').submit(function () {
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

  function getTime(totalSeconds) {
    hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    minutes = Math.floor(totalSeconds / 60);
    seconds = totalSeconds % 60;
    var result = "";
    if (hours != 0)
      result += (hours < 10 ? "0" + hours : hours) + ":";
    result += (minutes < 10 ? "0" + minutes : minutes);
    result += ":" + (seconds < 10 ? "0" + seconds : seconds);

    return result;
  }

  /**
   * Load a given Youtube video ID on the player
   */
  function loadPlayerForContent(media) {
    if (media == null) {
      if (timer)
        clearInterval(timer);

      $('.timer').css("color", "#E4D7C6")
      $('.timer').text('??? / ???')
      $('.playing').text("Nobody is playing !")
      $('.dj-name').text("")
      destroyYTPlayer();
    }
    else {
      mediaData = media;
      mediaData.pos = parseInt((media.endTime - Date.now()) / 1000);
      if (mediaData.pos < 0)
        console.warn("Media data position < 0 (" + mediaData.pos + ")")
      mediaData.pos = mediaData.pos < 0 ? 0 : mediaData.pos;
      if (timer)
        clearInterval(timer);
      timer = setInterval(function () {
        mediaData.pos--;
        $('.timer').css("color", (mediaData.pos < 10 ? "red" : "#E4D7C6"))
        $('.timer').text(getTime(mediaData.pos) + " / " + getTime(mediaData.duration))
      }, 1000);

      $('.playing').text(media.creatorName + " - " + media.title)
      $('.dj-name').text("Current DJ: " + media.djName)
      writeChatMessage(null, "Now playing: " + media.creatorName + " - " + media.title)

      // Players controls
      if (media.type == "youtube") {
        createYTPlayer(function (player) {
          player.loadVideoById({
            'videoId': media.contentID,
            'startSeconds': 0,
            'suggestedQuality': 'large'
          });
          player.seekTo((mediaData.duration - (media.endTime - Date.now()) / 1000))
          player.playVideo();
        })
      }
      else destroyYTPlayer();
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

    messages.append(messageEntry.append($('<b>').text(sender == null ? "" : sender + ": ")).append($('<span>').text(message)));
    messages.animate({scrollTop: $(document).height()}, "slow");
  }
}

function destroyYTPlayer() {
  if (player != null)
    player.destroy();
  player = null;
}

function createYTPlayer(onReady) {
  if (player) return onReady(player); // PLAYER exist
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
        onReady(event.target)
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

function onYouTubeIframeAPIReady() {
  room.ytAPIReady = true;
}
