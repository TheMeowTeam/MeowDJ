if (!Date.now) {
  Date.now = function () {
    return new Date().getTime();
  };
}

var room;
var ytPlayer;
var scPlayer;
var volume = 100;

/**
 * Room class
 */
function Room() {

  this.connect = connect;
  var room = local.room;
  var messages = $('.chat .messages');
  var initialized = false;
  var timer = null;
  var mediaData = null;
  var delay = 0;

  /**
   * Initialize room's components
   */
  function connect() {
    if (!initialized) {
      initComponents();
      io.socket.post('/' + room.identifier + '/subscribe', function (response) {

        if (response.result === 'ok') {
          writeChatMessage(room.name, response.motd);
          initializePlayer();
          loadPlayerForContent(response.media);
          setInterval(function () {
            io.socket.post('/' + room.identifier + '/playlist/position', function (result) {
              if (result && result.position !== -1 && mediaData)
                delay = result.position - mediaData.pos;
            });
          }, 5000);
        } else writeChatMessage('System', 'An error occurred when loading this room, please try again later or contact a staff member!', 'system');
      });
      initialized = true;
    }
  }

  function initComponents() {
    $('.media-select').click(function () {
      $('#media-queue').css("display", "table");
    });
    $('.volume').on('input', function () {
      var newValue = this.value;
      $('.volume-label').text(newValue + "%");
      volume = newValue;
      if (ytPlayer != null)
        ytPlayer.setVolume(volume);
      if (scPlayer != null)
        scPlayer.setVolume(volume / 100);
    });

    $(document).on('keydown', function (event) {
      // Force quit the modal
      if ((event.keyCode ? event.keyCode : event.which) === 27)
        $('#media-queue').css("display", "none");
    });
    $('#media-queue form').submit(function () {
      var textbox = $('#url');
      if (textbox.val()) {
        io.socket.post('/' + room.identifier + '/playlist/add', {
          url: textbox.val()
        });
        textbox.val('');
        $('#media-queue').css("display", "none");
      }
      return false;
    });
  }

  /**
   * Initialize room's player
   */
  function initializePlayer() {
    scPlayer = SC.Widget(document.getElementById('soundcloud-player'));
    io.socket.on('media/update', function (data) {
      loadPlayerForContent(data);
    });
  }

  /**
   * Initialize room's chat
   */
  function initializeChat() {

    $('.chat-box form').submit(function () {
      var textbox = $('#message');

      if (!textbox.val())
        return false;

      io.socket.post('/' + room.identifier + '/chat', {
        message: textbox.val()
      });

      textbox.val('');

      return false;
    });

    io.socket.on('chat', function (data) {
      writeChatMessage(data.username, data.message);
    });
  }

  function getTime(totalSeconds) {
    totalSeconds = parseInt(totalSeconds, 10);
    var hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;
    var result = "";
    if (hours !== 0)
      result += (hours < 10 ? "0" + hours : hours) + ":";
    result += (minutes < 10 ? "0" + minutes : minutes);
    result += ":" + (seconds < 10 ? "0" + seconds : seconds);

    return result;
  }

  function resetDisplay() {
    if (timer)
      clearInterval(timer);

    $('.timer').css("color", "#E4D7C6");
    $('.timer').text('??? / ???');
    $('.playing').text("Nobody is playing !");
    $('.dj-name').text("");
    loadArtwork("/common/images/logo.png");
    createYTPlayer(function () {
      maskYTPlayer();
    });

  }

  function loadArtwork(url) {
    $('#artwork').css("background-image", "url('" + url + "')");
    $('#artwork').css("display", "block");
  }

  function updateDisplay(media) {
    mediaData = media;
    mediaData.pos = parseInt((media.endTime - media.serverTime) / 1000);
    if (mediaData.pos < 0)
      console.warn("Media data position < 0 (" + mediaData.pos + ")");
    mediaData.pos = mediaData.pos < 0 ? 0 : mediaData.pos;
    if (timer)
      clearInterval(timer);
    timer = setInterval(function () {
      mediaData.pos--;
      $('.timer').css("color", (mediaData.pos < 10 ? "red" : "#E4D7C6"));
      $('.timer').text(getTime(mediaData.pos) + " / " + getTime(mediaData.duration / 1000) + (delay > 1 ? " (" + delay + "s)" : ""));
    }, 1000);

    $('.playing').text(media.creatorName + " - " + media.title);
    $('.dj-name').text("Current DJ: " + media.djName);
    writeChatMessage(null, "Now playing: " + media.creatorName + " - " + media.title);
    // Players controls
    maskYTPlayer();
  }

  function loadYoutubeContent(media) {
    createYTPlayer(function (player) {
      $('#artwork').css("display", "none");
      $('#player').css("display", "block");
      player.setVolume(volume);
      player.loadVideoById({
        'videoId': media.contentID,
        'startSeconds': 0,
        'suggestedQuality': 'large'
      });
      var start = (mediaData.duration - (media.endTime - media.serverTime)) / 1000;
      player.seekTo(start < 0 ? 0 : start);
      player.playVideo();
    });
  }

  function loadSoundcloudContent(media) {
    $('#artwork').css("display", "block");
    scPlayer.load(media.url);
    scPlayer.bind(SC.Widget.Events.READY, function () {
      scPlayer.play();
      scPlayer.unbind(SC.Widget.Events.READY);
    });
    scPlayer.bind(SC.Widget.Events.PLAY, function () {
      var start = (mediaData.duration - (media.endTime - media.serverTime));
      if (mediaData.pos < 0)
        console.warn("Media start position < 0 (" + start + ")");
      scPlayer.setVolume(volume / 100);
      scPlayer.seekTo(start);
      scPlayer.getCurrentSound(function (data) {
        loadArtwork(data.artwork_url.replace("-large", "-t300x300"));
      });
      scPlayer.unbind(SC.Widget.Events.PLAY);
    });
  }
  /**
   * Load a given Youtube video ID on the player
   */
  function loadPlayerForContent(media) {
    if (media == null) {
      resetDisplay();
    }
    else {
      updateDisplay(media);
      switch (media.type) {
        case "youtube":
          loadYoutubeContent(media);
          break;
        case "soundcloud":
          loadSoundcloudContent(media);
          break;
        default:
          break;
      }
    }
  }

  /**
   * Write a message in the room's chat
   */
  function writeChatMessage(sender, message, style) {

    if (!initialized)
      initializeChat();
    var messageEntry = $('<li>');

    if (style) {
      messageEntry.addClass('chat-' + style);
    }

    messages.append(messageEntry.append($('<b>').text(sender == null ? "" : sender + ": ")).append($('<span>').text(message)));
    messages.animate({scrollTop: $(document).height()}, "slow");
  }

  function maskYTPlayer() {
    if (ytPlayer != null) {
      $('#player').css("display", "none");
    }
  }

  function createYTPlayer(onReady) {
    if (!ytPlayer) {
      ytPlayer = new YT.Player('player', {
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
            onReady(event.target);
          },
          'onStateChange': function (event) {
            if (event.data === YT.PlayerState.PAUSED) {
              event.target.playVideo();
            }
          }
        }
      });
    }
    else onReady(ytPlayer);
  }
}

$(document).ready(function () {
  if (local.page === 'room') {
    room = new Room();
    room.connect();

    var resize = function () {
      $('.chat .messages').css('height', $(window).height() - 34);
    };

    $(window).resize(resize);
    resize();
  }
});
