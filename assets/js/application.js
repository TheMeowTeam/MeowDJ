/**
 * Room class
 */
function Room() {

  var roomId;

  function _() {

    roomId = local.roomId;

    io.socket.post('/' + roomId + '/subscribe', {
      roomId: roomId
    });

    enableChat();
  }

  /**
   * Enable room's chat
   */
  function enableChat() {

    $('.chat .messages').css('height', $(window).height() - 34);

    io.socket.on('chat', function(message) {
      $('.chat .messages').append($('<li>').append($('<b>').text(message.username + " : ")).append($('<span>').text(message.message)));
      $('.chat .messages').animate({ scrollTop: $(document).height() }, "slow");
    });

    $('.chat form').submit(function() {
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
  }

  _();
}

$(document).ready(function() {

  if (local.page == 'room') {
    new Room();
  }

  $(window).resize(function() {
    $('html, body').css('height', $('.container-fluid').height());
  });

});
