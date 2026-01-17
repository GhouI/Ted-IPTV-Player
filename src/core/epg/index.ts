/**
 * EPG (Electronic Program Guide) module
 */

export {
  parseXMLTVDate,
  parseEpisodeNum,
  parseXMLTV,
  xmltvToEPGData,
  parseXMLTVToEPG,
  getChannelMapping,
  type XMLTVChannel,
  type XMLTVProgram,
  type XMLTVData,
} from './xmltvParser'

export {
  EPGCache,
  getEPGCache,
  resetEPGCache,
  type EPGCacheOptions,
} from './epgCache'
