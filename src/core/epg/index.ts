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

export {
  EPGTimeSync,
  getEPGTimeSync,
  resetEPGTimeSync,
  isProgramNowPlaying,
  getProgramProgress,
  getProgramTimeRemaining,
  findCurrentProgram,
  findNextProgram,
  type TimeSyncOptions,
  type TimeSyncState,
  type TimeSyncResult,
} from './timeSync'
