$(document).ready(function () {
  if (local.page === "home") {
    var popup = null;

    if (local.user == null) {
      io.socket.post('/login/subscribe', function (response) {

        if (response.result !== 'ok') {
          console.error('An error occured while loading the application! Please try again later!');
        }
        var personnalGuid  = response.guid;

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
});
