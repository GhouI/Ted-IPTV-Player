/**
 * API module exports
 */

export { XtreamClient, XtreamApiError, createAuthenticatedClient } from './xtreamClient'
export type { XtreamClientConfig } from './xtreamClient'

export {
  parseM3U,
  fetchAndParseM3U,
  extractGroups,
  filterByGroup,
  filterUngrouped,
  hasEPGInfo,
  getEPGIdentifier,
  M3UParseError,
} from './m3uParser'
export type { M3UItem, M3UHeader, M3UPlaylist } from './m3uParser'
