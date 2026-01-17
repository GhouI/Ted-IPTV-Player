/**
 * Type declarations for HTML5 Media API extensions
 *
 * These APIs are part of the HTML5 specification but may not be
 * included in standard TypeScript DOM types. They are available
 * in modern browsers that support multi-track audio/video.
 */

/**
 * Represents a single audio track in a media element
 */
interface AudioTrackListItem {
  readonly id: string
  readonly kind: string
  readonly label: string
  readonly language: string
  enabled: boolean
  readonly sourceBuffer: SourceBuffer | null
}

/**
 * Collection of audio tracks in a media element
 */
interface AudioTrackList {
  readonly length: number
  [index: number]: AudioTrackListItem
  getTrackById(id: string): AudioTrackListItem | null
  onaddtrack: ((event: Event) => void) | null
  onremovetrack: ((event: Event) => void) | null
  onchange: ((event: Event) => void) | null
}

/**
 * Represents a single video track in a media element
 */
interface VideoTrackListItem {
  readonly id: string
  readonly kind: string
  readonly label: string
  readonly language: string
  selected: boolean
  readonly sourceBuffer: SourceBuffer | null
}

/**
 * Collection of video tracks in a media element
 */
interface VideoTrackList {
  readonly length: number
  readonly selectedIndex: number
  [index: number]: VideoTrackListItem
  getTrackById(id: string): VideoTrackListItem | null
  onaddtrack: ((event: Event) => void) | null
  onremovetrack: ((event: Event) => void) | null
  onchange: ((event: Event) => void) | null
}

/**
 * Extend HTMLVideoElement with audio/video track lists
 */
interface HTMLVideoElement {
  readonly audioTracks?: AudioTrackList
  readonly videoTracks?: VideoTrackList
}

/**
 * Extend HTMLMediaElement with audio/video track lists
 */
interface HTMLMediaElement {
  readonly audioTracks?: AudioTrackList
  readonly videoTracks?: VideoTrackList
}
