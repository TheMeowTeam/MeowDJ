if (!Date.now) {
  Date.now = function () {
    return new Date().getTime();
  }
}

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
  var timer = null;
  var mediaData = null;

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
          return false;

        io.socket.post('/' + room.identifier + '/playlist/add', {
          roomId: room.identifier,
          url: textbox.val()
        });

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

    if (subscribeResponse.media != null)
      loadPlayerForContent(player, subscribeResponse.media);

    io.socket.on('media/update', function (data) {
      loadPlayerForContent(player, data)
    });
  }

  /**
   * Initialize room's chat
   */
  function initializeChat(response) {

    $('.chat form').submit(function() {

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

    var result = '';

    if (hours != 0)
      result += (hours < 10 ? '0' + hours : hours) + ':';

    result += (minutes < 10 ? '0' + minutes : minutes);
    result += ':' + (seconds  < 10 ? '0' + seconds : seconds);

    return result;
  }

  /**
   * Load a given Youtube video ID on the player
   */
  function loadPlayerForContent(player, media) {

    if (media == null) {

      if (timer)
        clearInterval(timer);

      player.loadVideoById(null);
      $('.timer').css('color', '#E4D7C6')
      $('.timer').text('??? / ???')
    }
    else if (media.type == 'youtube') {

      playerData = {
        'videoId': media.contentID,
        'startSeconds': media.duration - (media.endTime - (Date.now() / 1000 | 0)),
        'suggestedQuality': 'large'
      };

      mediaData = media;
      mediaData.pos = mediaData.duration - playerData.startSeconds;

      if (timer)
        clearInterval(timer);

      timer = setInterval(function() {

        mediaData.pos--;
        $('.timer').css('color', (mediaData.pos < 10 ? 'red' : '#E4D7C6'));
        $('.timer').text(getTime(mediaData.pos) + ' / ' + getTime(mediaData.duration));
      }, 1000);

      player.loadVideoById(playerData);
      player.playVideo();

      writeChatMessage(null, 'Now playing: ' + media.channelTitle + ' - ' + media.title)
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

    messages.append(messageEntry.append($('<b>').text(sender == null ? '' : sender + ': ')).append($('<span>').text(message)));
    messages.animate({scrollTop: $(document).height()}, 'slow');
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

function guid() {

  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }

  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

$(document).ready(function () {

  if (local.page == 'home') {

    var personnalGuid = guid();
    var popup = null;

    io.socket.post('/login/subscribe', {
      guid: personnalGuid
    }, function (response) {

      if (response.result != 'ok') {
        alert('An error occured while loading the application! Please try again later!');
      }
    });

    io.socket.on('login-callback', function (data) {

      if (popup != null)
        popup.close();

      location.reload();
    });

    $('#login').click(function(event) {

      event.preventDefault();
      popup = window.open(local.authenticationHost + '/login?guid=' + personnalGuid + '&host=' + local.baseURL, 'popupWindow', 'width=400,height=600,scrollbars=yes');
    });
  }
  else if (local.page == 'room') {

    room = new Room();
    room.initialize();

    var resize = function () {
      $('.chat .messages').css('height', $(window).height() - 34);
    };

    $(window).resize(resize);
    resize();
  }
});
