if (sails.activeMedia == null) {
  sails.log.info("Initializing Active Media Service...")
  sails.activeMedia = Object.create(null)
}

function getMedia(roomID) {
  return sails.activeMedia[roomID];
}

function sendPlayUpdate(channel, activeMediaData) {
  if (activeMediaData.content)
    activeMediaData.content.serverTime = Date.now();
  sails.sockets.broadcast(channel, 'media/update', activeMediaData.content);
}

function changeMedia(roomID, content, type) {
  if (content == null) {
    sails.activeMedia[roomID] = null;
    sendPlayUpdate(roomID, {}) // Force client clean up
    return;
  }
  if (sails.activeMedia[roomID])
    clearTimeout(sails.activeMedia[roomID].task)
  else sails.activeMedia[roomID] = []
  content.type = type;
  sails.activeMedia[roomID].content = content;
  sails.activeMedia[roomID].content.endTime = ((Date.now() + (content.duration * 1000)));
  sails.activeMedia[roomID].task = setTimeout(function () {
    nextMedia(roomID);
  }, content.duration * 1000);
  sendPlayUpdate(roomID, getMedia(roomID));
}

function nextMedia(roomID) {
  WaitingQueue.find({roomID: roomID}).sort({createdAt: 'asc'}).limit(1).exec(function (err, data) {
    if (err)
      sails.log.warn("Error during fetching of next active media! " + JSON.stringify(err))

    // No data, end of the queue
    if (data == null || data.length == 0) {
      changeMedia(roomID, null, null);
      return;
    }
    data = data[0];
    WaitingQueue.destroy({id: data.id}, function (err) {

      if (err)
        sails.log.warn(JSON.stringify(err))
      else
        sails.log.debug("Entry: " + data.id + " destroyed")
    });
    if (data.type == 'youtube') {
      YoutubeCache.findOne({id: data.cacheID}, function (err, cacheEntry) {
        // Entry not found, THIS SHOULDN'T BE POSSIBLE
        if (err || !cacheEntry)
          sails.log.error("Invalid cache entry " + data.cacheID + "! Is your metadata cache corrupted?!")
        else
          changeMedia(roomID, cacheEntry, data.type);
      });
    }
    else
      sails.log.warn("Unknown content type '" + data.type + "'")
  });
}

module.exports = {
  changeMedia: changeMedia,
  getMedia: getMedia,
  nextMedia: nextMedia,
  isPlaying: function (roomID) {
    return getMedia(roomID) != null
  }
}
