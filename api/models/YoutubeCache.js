/**
 * YoutubeCache.js - Cache of YTv3 Data API calls
 * TODO: use a separate Waterline connector
 * @description :: Room model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  attributes: {
    id: {type: 'string', unique: true, required: true},
    channelID: {type: 'string', required: true},
    channelTitle: {type: 'string', required: true},
    title: {type: 'string', required: true},
    duration: {type: 'integer', required: true},
    licensedContent: {type: 'boolean', required: true}
  }
}
