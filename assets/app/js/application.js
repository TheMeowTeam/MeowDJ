if (!Date.now) {
  Date.now = function () {
    return new Date().getTime();
  }
}

var room;
var ytPlayer;
var scPlayer;
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
  var delay = 0;
  this.initialize = initialize;

  /**
   * Initialize room's components
   */
  function initialize() {

    if (initialized)
      return;

    io.socket.post('/' + room.identifier + '/subscribe', function (response) {

      if (response.result != 'ok') {
        writeChatMessage('System', 'An error occured when loading this room, please try again later or contact a staff member!', 'system');
        return;
      }

      subscribeResponse = response;

      initializeChat(response);
      initializePlayer();

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
          url: textbox.val()
        })
        textbox.val('');
        $('#media-queue').css("display", "none");
        return false;
      });
      loadPlayerForContent(response.media)
      setInterval(function () {
        io.socket.post('/' + room.identifier + '/playlist/position', function (result, err) {
          if (result && result.position != -1 && mediaData)
            delay = result.position - mediaData.pos;
        });
      }, 5000);
    });
    initialized = true;
  }

  /**
   * Initialize room's player
   */
  function initializePlayer() {
    scPlayer = SC.Widget(document.getElementById('soundcloud-player'));
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
    totalSeconds = parseInt(totalSeconds, 10)
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

  function resetDisplay() {
    if (timer)
      clearInterval(timer);

    $('.timer').css("color", "#E4D7C6")
    $('.timer').text('??? / ???')
    $('.playing').text("Nobody is playing !")
    $('.dj-name').text("")
    loadArtwork("/common/images/logo.png");
    createYTPlayer(function () {
      maskYTPlayer();
    })

  }

  function loadArtwork(url) {
    $('#artwork').css("background-image", "url('" + url + "')")
    $('#artwork').css("display", "block")
  }

  /**
   * Load a given Youtube video ID on the player
   */
  function loadPlayerForContent(media) {
    if (media == null) {
      resetDisplay();
    }
    else {
      mediaData = media;
      mediaData.pos = parseInt((media.endTime - media.serverTime) / 1000);
      if (mediaData.pos < 0)
        console.warn("Media data position < 0 (" + mediaData.pos + ")")
      mediaData.pos = mediaData.pos < 0 ? 0 : mediaData.pos;
      if (timer)
        clearInterval(timer);
      timer = setInterval(function () {
        mediaData.pos--;
        $('.timer').css("color", (mediaData.pos < 10 ? "red" : "#E4D7C6"))
        $('.timer').text(getTime(mediaData.pos) + " / " + getTime(mediaData.duration / 1000) + (delay > 1 ? " (" + delay + "s)" : ""))
      }, 1000);

      $('.playing').text(media.creatorName + " - " + media.title)
      $('.dj-name').text("Current DJ: " + media.djName)
      writeChatMessage(null, "Now playing: " + media.creatorName + " - " + media.title)

      var start = (mediaData.duration - (media.endTime - media.serverTime)) / 1000;
      if (mediaData.pos < 0)
        console.warn("Media start position < 0 (" + start + ")")
      start = start < 0 ? 0 : start;

      // Players controls
      maskYTPlayer();
      if (media.type == "youtube") {
        createYTPlayer(function (player) {
          $('#artwork').css("display", "none")
          $('#player').css("display", "block")
          player.setVolume(volume);
          player.loadVideoById({
            'videoId': media.contentID,
            'startSeconds': 0,
            'suggestedQuality': 'large'
          });

          player.seekTo(start)
          player.playVideo();
        })
      }
      else if (media.type == "soundcloud") {
        $('#artwork').css("display", "block")
        scPlayer.load(media.url)
        scPlayer.bind(SC.Widget.Events.READY, function () {
          scPlayer.play();
          scPlayer.unbind(SC.Widget.Events.READY);
        });
        scPlayer.bind(SC.Widget.Events.PLAY, function () {
          var start = (mediaData.duration - (media.endTime - media.serverTime));
          if (mediaData.pos < 0)
            console.warn("Media start position < 0 (" + start + ")")
          scPlayer.setVolume(volume / 100);
          scPlayer.seekTo(start)
          scPlayer.getCurrentSound(function (data) {
            loadArtwork(data.artwork_url.replace("-large", "-t300x300"))
          })
          scPlayer.unbind(SC.Widget.Events.PLAY);
        });
      }
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

  function maskYTPlayer() {
    if (ytPlayer != null) {
      $('#player').css("display", "none")
    }
  }

  function createYTPlayer(onReady) {
    if (ytPlayer) return onReady(ytPlayer); // PLAYER exist
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

  function createSCPlayer(onReady) {
    if (scPlayer) return onReady(scPlayer); // PLAYER exist
  }
}

$(document).ready(function () {

  if (local.page == "home") {

    var personnalGuid = null;
    var popup = null;

    if (local.user == null) {
      io.socket.post('/login/subscribe', {
        guid: personnalGuid
      }, function (response) {

        if (response.result != 'ok') {
          alert('An error occured while loading the application! Please try again later!');
        }
        personnalGuid = response.guid;

        io.socket.on('login-callback', function (data) {

          if (popup != null)
            popup.close();

          $.redirect('/login/authenticate', {
            guid: personnalGuid,
            userId: data.user.id,
            userUsername: data.user.username,
            userRank: data.user.rank,
            transactionID: data.user.transactionID
          });
        });

        $('#login').click(function (event) {
          event.preventDefault();
          popup = window.open(local.authenticationHost + '/login?guid=' + personnalGuid + '&host=' + local.baseURL, 'popupWindow', 'width=400,height=600,scrollbars=yes');
        });
      });
    }

    $('#create').click(function (event) {
      event.preventDefault();
      window.location.replace('/create');
    });

    $('#room-join').click(function (event) {
      event.preventDefault();
      window.location.replace('/' + local.userRoom);
    });
  }
  else if (local.page == 'room') {
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

}
