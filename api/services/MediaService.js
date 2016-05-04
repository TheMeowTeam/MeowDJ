var logger = sails.log;
logger.info("Starting Media Service...")
var google = require('googleapis');
var request = require('request');
var local = null;
var youtube = null;
var soundCloudToken = null;

// ====================================== LOADING ======================================
// Gather config/local.js
try {
  local = require('../../config/local.js')
  soundCloudToken = local.soundCloudKey;
}
catch (e) {
  logger.error("Cannot get config/local.js")
  logger.error("Shutting down!")
  process.exit(42)
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
}

// ====================================== PARSER ======================================
function parseYT(url) {
  var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&\?]*).*/;
  var match = url.match(regExp);
  return (match && match[7].length == 11) ? {type: "youtube", "contentID": match[7]} : null;
}

function parseSC(url) {
  var regExpr = /^(http|https)?:\/\/(soundcloud.com|snd.sc)\/(.*)$/;
  var match = url.match(regExpr)

  if (match && match[3]) {
    return {type: "soundcloud", "contentID": match[3]}
  }
  return null;
}

// ====================================== CACHING ======================================
function createYTCache(err, data, user, roomId, url) {
  if (err)
    sails.log.warn("Error during YTv3 API data fetching: " + err)
  else {
    var item = data.items[0];
    var duration = convertYTDuration(item.contentDetails.duration);
    if (duration == -1) {
      sails.log.warn("Duration invalid for mediaID " + content.contentID);
      return;
    }
    MediaCache.create({
      contentID: item.id,
      creatorID: item.snippet.channelId,
      creatorName: item.snippet.channelTitle,
      title: item.snippet.title,
      duration: duration,
      licensedContent: item.contentDetails.licensedContent,
      url: url,
      type: "youtube"
    }, function (err, data) {
      if (err)
        sails.log.warn("Error during YTv3 API data caching: " + JSON.stringify(err))
      ActiveMediaService.processAddWaitingQueue(roomId, user, data);
    })
  }
}

function createSCCache(err, data, user, roomId)
{
  if (err || data.embeddable_by != "all")
    sails.log.warn("Error during SoundCloud API data fetching: " + (!err ? "Cannot be embed!" : err))
  else {
    MediaCache.create({
      contentID: parseSC(data.permalink_url).contentID,
      creatorID: data.user.id,
      creatorName: data.user.username,
      title: data.title,
      duration: data.duration,
      licensedContent: data.license != "no-rights-reserved",
      url: data.uri,
      type: "soundcloud"
    }, function (err, data) {
      if (err)
        sails.log.warn("Error during SoundCloud API data caching: " + JSON.stringify(err))
      ActiveMediaService.processAddWaitingQueue(roomId, user, data);
    })
  }
}

// ====================================== UTILS ======================================
function convertYTDuration(iso8601time) {
  var match = iso8601time.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
  if (match == null)
    return -1;
  var hours = (parseInt(match[1]) || 0);
  var minutes = (parseInt(match[2]) || 0);
  var seconds = (parseInt(match[3]) || 0);

  return hours * 3600 + minutes * 60 + seconds;
}

function resolveSoundCloud(url, callback)
{
  if (soundCloudToken == null)
    callback("API Key not provided")
  request.post("http://api.soundcloud.com/resolve", {form: {client_id: soundCloudToken, url: url}}, function (error, httpResponse, body) {
    if (error == null && httpResponse.statusCode == 302)
    {
      var res = JSON.parse(body);
      if (res)
        request.get(res.location, function (error, httpResponse, body) {
          var response = null;
          if (error == null && httpResponse.statusCode == 200)
            response = JSON.parse(body);
          else if (error == null)
            error = httpResponse.statusCode;
          callback(error, response);
        });
    }
    else
      callback(httpResponse.statusCode)
  })
}


// ====================================== EXPORTS ======================================
module.exports = {
  fetchContentData: function (content, user, roomID, url) {
    if (content.type == "youtube")
      youtube.videos.list({part: 'snippet,contentDetails', id: content.contentID}, function (err, data) {
        createYTCache(err, data, user, roomID, url);
      });
    else if (content.type == "soundcloud")
      resolveSoundCloud("https://soundcloud.com/" + content.contentID, function (err, data) {
        createSCCache(err, data, user, roomID);
      });
    else
      sails.log.warn("Unknown media type " + content.type);
  },
  parseURL: function (url) {
    var videoID = parseYT(url);
    return !videoID ? parseSC(url) : videoID;
  }
}
