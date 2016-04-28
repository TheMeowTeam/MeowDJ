var google = require('googleapis');
var local = null;
sails.log.info("Initializing YTv3 Data API connector...")
try {
  local = require('../../config/local.js')
}
catch (e) {
  sails.log.error("Youtube API Key not provided or config/local.js is invalid!")
  sails.log.error("Shutting down!")
  process.exit(42)
}
var youtube = google.youtube({version: 'v3', auth: local.youtubeKey});
sails.log.info("Youtube integration ready to be used!");
module.exports = {
  fetchVideoData: function (videoID, callback) {
    youtube.videos.list({part: 'snippet,contentDetails', id: videoID}, callback);
  },
  getVideoID: function (url) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&\?]*).*/;
    var match = url.match(regExp);
    return (match && match[7].length == 11) ? match[7] : null;
  },
  convertDuration: function (iso8601time) {
    var match = iso8601time.match(/PT(\d+H)?(\d+M)?(\d+S)?/)

    var hours = (parseInt(match[1]) || 0);
    var minutes = (parseInt(match[2]) || 0);
    var seconds = (parseInt(match[3]) || 0);

    return hours * 3600 + minutes * 60 + seconds;
  }
}
