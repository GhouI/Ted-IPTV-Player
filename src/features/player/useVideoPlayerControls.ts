import { usePlayerStore } from '../../core/stores/playerStore'

/**
 * Hook to control the video player via the store
 */
export function useVideoPlayerControls() {
  const playerStore = usePlayerStore()

  return {
    // State
    playbackState: playerStore.playbackState,
    currentTime: playerStore.currentTime,
    duration: playerStore.duration,
    bufferedTime: playerStore.bufferedTime,
    volume: playerStore.volume,
    isMuted: playerStore.isMuted,
    isLive: playerStore.isLive,
    isSeekable: playerStore.isSeekable,
    qualityTracks: playerStore.qualityTracks,
    selectedQuality: playerStore.selectedQuality,
    isAutoQuality: playerStore.isAutoQuality,
    audioTracks: playerStore.audioTracks,
    selectedAudioTrack: playerStore.selectedAudioTrack,
    subtitleTracks: playerStore.subtitleTracks,
    selectedSubtitleTrack: playerStore.selectedSubtitleTrack,
    error: playerStore.error,
    controlsVisible: playerStore.controlsVisible,
    isFullscreen: playerStore.isFullscreen,

    // Computed values
    isPlaying: playerStore.isPlaying(),
    isBuffering: playerStore.isBuffering(),
    progressPercent: playerStore.getProgressPercent(),
    bufferPercent: playerStore.getBufferPercent(),
    volumePercent: playerStore.getVolumePercent(),
    qualityLabel: playerStore.getCurrentQualityLabel(),

    // Actions
    showControls: playerStore.showControls,
    hideControls: playerStore.hideControls,
    setFullscreen: playerStore.setFullscreen,
    toggleMute: playerStore.toggleMute,
    setVolume: playerStore.setVolume,
    selectQuality: playerStore.selectQuality,
    enableAutoQuality: playerStore.enableAutoQuality,
    selectAudioTrack: playerStore.selectAudioTrack,
    selectSubtitleTrack: playerStore.selectSubtitleTrack,
  }
}
