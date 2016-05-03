var logger = sails.log;
logger.info("Starting Media Service...")
var google = require('googleapis');
var local = null;
var youtube = null;

// Gather config/local.js
try {
  local = require('../../config/local.js')
}
catch (e)
{
  logger.error("Cannot get config/local.js")
  logger.error("Shutting down!")
}

// Youtube
try {

  logger.info("Initializing YTv3 Data API connector...")
  youtube = google.youtube({version: 'v3', auth: local.youtubeKey});
  logger.info("Youtube integration ready to be used!");
}
catch (e) {
  logger.warn("Youtube API Key incorrect!")
  logger.warn("Youtube content will no be available!")
  process.exit(42)
}


module.exports = {
  fetchVideoData: function (videoID, callback) {
    youtube.videos.list({part: 'snippet,contentDetails', id: videoID}, callback);
  },
  getVideoID: function (url) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&\?]*).*/;
    var match = url.match(regExp);
    return (match && match[7].length == 11) ? {type: "youtube", "contentID": match[7]} : null;
  },
  convertDuration: function (iso8601time) {
    var match = iso8601time.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
    if (match == null)
      return -1;
    var hours = (parseInt(match[1]) || 0);
    var minutes = (parseInt(match[2]) || 0);
    var seconds = (parseInt(match[3]) || 0);

    return hours * 3600 + minutes * 60 + seconds;
  }
}
