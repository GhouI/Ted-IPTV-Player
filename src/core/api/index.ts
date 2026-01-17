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

export {
  generateCategoryId,
  generateChannelId,
  detectStreamType,
  extractCategories,
  extractChannels,
  adaptM3UPlaylist,
  getChannelsByCategory,
  findChannelByEpgId,
  getChannelCountByCategory,
} from './m3uAdapter'
export type { M3UAdapterOptions, M3UAdapterResult } from './m3uAdapter'

export {
  SourceNormalizer,
  SourceNormalizerError,
  createSourceNormalizer,
} from './sourceNormalizer'
export type { SourceValidationResult, NormalizedContent } from './sourceNormalizer'

export {
  CredentialStore,
  CredentialStoreError,
  createCredentialStore,
  getCredentialStore,
  resetDefaultStore,
} from './credentialStore'
export type { CredentialStoreOptions, CredentialStoreErrorCode } from './credentialStore'
