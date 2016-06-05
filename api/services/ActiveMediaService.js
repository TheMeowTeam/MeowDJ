if (sails.activeMedia == null) {
  sails.log.info("Initializing Active Media Service...")
  sails.activeMedia = Object.create(null)
}

function processAddWaitingQueue(roomID, user, data) {
  WaitingQueue.create({roomID: roomID, userID: user.id, cacheID: data.id}, function (err) {
    if (err)
      sails.log.warn("Error during adding to waiting queue " + JSON.stringify(err))

    if (!isPlaying(roomID)) {
      nextMedia(roomID);
    }
  });
}

function getMedia(roomID) {
  return sails.activeMedia[roomID];
}

function isPlaying(roomID) {
  return getMedia(roomID) != null
}

function sendPlayUpdate(channel, activeMediaData) {
  if (activeMediaData.content != null)
    activeMediaData.content.serverTime = Date.now();
  sails.sockets.broadcast(channel, 'media/update', activeMediaData.content);
}

function changeMedia(roomID, content) {
  if (content == null) {
    sails.activeMedia[roomID] = null;
    sendPlayUpdate(roomID, {}) // Force client clean up
    return;
  }
  if (sails.activeMedia[roomID])
    clearTimeout(sails.activeMedia[roomID].task)
  else sails.activeMedia[roomID] = []
  if (content.type === "youtube")
    content.duration *= 1000;
  sails.activeMedia[roomID].content = content;
  sails.activeMedia[roomID].content.startTime = Date.now();
  sails.activeMedia[roomID].content.endTime = ((Date.now() + content.duration));
  sails.activeMedia[roomID].task = setTimeout(function () {
    nextMedia(roomID);
  }, content.duration);
  sendPlayUpdate(roomID, getMedia(roomID));
}

function nextMedia(roomID) {
  WaitingQueue.find({roomID: roomID}).sort({createdAt: 'asc'}).limit(1).exec(function (err, data) {
    if (err)
      sails.log.warn("Error during fetching of next active media! " + JSON.stringify(err))

    // No data, end of the queue
    if (data == null || data.length == 0) {
      changeMedia(roomID, null);
      return;
    }
    data = data[0];
    WaitingQueue.destroy({id: data.id}, function (err) {
      if (err)
        sails.log.warn(JSON.stringify(err));
    });
    MediaCache.findOne({id: data.cacheID}, function (err, cacheEntry) {
      // Entry not found, THIS SHOULDN'T BE POSSIBLE
      if (!err && cacheEntry)
        User.findOne({id: data.userID}, function (err, nextDJ) {
          if (err || !nextDJ)
            cacheEntry.djName = "???";
          else
            cacheEntry.djName = nextDJ.username;
          changeMedia(roomID, cacheEntry);
        })

    });
  });
}

module.exports = {
  changeMedia: changeMedia,
  getMedia: getMedia,
  nextMedia: nextMedia,
  isPlaying: isPlaying,
  processAddWaitingQueue: processAddWaitingQueue
}
