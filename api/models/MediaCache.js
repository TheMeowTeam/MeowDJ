/**
 * MediaCache.js - Cache of all medias
 * TODO: use a separate Waterline connector
 * @description :: MediaCache model
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  autoCreatedAt: false,
  autoUpdatedAt: false,
  attributes: {
    contentID: {type: 'string', unique: true, required: true},
    creatorID: {type: 'string', required: true},
    creatorName: {type: 'string', required: true},
    title: {type: 'string', required: true},
    url: {type: 'string', required: true},
    duration: {type: 'integer', required: true},
    licensedContent: {type: 'boolean', required: true},
    type: {type: 'string', required: true, enum: ['youtube', 'soundcloud']}
  }
}
