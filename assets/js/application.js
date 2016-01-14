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

    io.socket.on('chat', function(message) {
      $('#messages').append($('<li>').text(message));
    });

    $('form').submit(function() {
      io.socket.post('/' + roomId + '/chat', {
        roomId: roomId,
        message: $('#m').val()
      });

      $('#m').val('');

      return false;
    });
  }

  _();
}

$(document).ready(function() {

  if (local.page == 'room') {
    new Room();
  }
});
