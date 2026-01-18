# Ted IPTV Player for Hisense/VIDAA

## Problem Statement

Hisense smart TV users running VIDAA OS have no free, open-source IPTV player available. All existing IPTV apps on the VIDAA store are paid or subscription-based. Users who already pay for IPTV services from their providers cannot easily access their content on their Hisense TVs without paying for yet another app.

Users need a way to:
- Enter their IPTV provider credentials (Xtream Codes or M3U playlist URL)
- Browse and watch live TV channels
- Access VOD (movies) and Series content
- View the Electronic Program Guide (EPG)
- Manage multiple IPTV sources

## Solution

Build an open-source IPTV player as an HTML5 web application for VIDAA OS. The app will be fully client-side (no backend required), allowing users to self-host or use a hosted version. Users can sideload the app onto their Hisense TV using community tools.

**Key Features:**
- Xtream Codes API and M3U playlist support
- Live TV with category browsing and channel grid
- VOD (movies) browsing and playback
- Series with seasons and episodes
- Full EPG with grid view and program details
- Multiple IPTV source management
- Remote control navigation (D-pad only)

## Technical Approach

**Stack:**
- React 18 + TypeScript + Vite (with Preact fallback option for bundle size)
- Zustand for client state, React Query for server state
- Shaka Player for video (HLS + DASH + DRM support)
- Norigin Spatial Navigation for TV remote control
- Tailwind CSS with aggressive purging

**Architecture Pattern:**
- Feature-based structure with `core/` layer for shared services
- `platform/vidaa/` for TV-specific code (keymap, system APIs)
- PlayerAdapter abstraction for video playback flexibility
- SourceNormalizer to unify Xtream and M3U data formats
- Encrypted credential storage using device-specific keys

**Bundle Strategy:**
- Initial shell under 100KB
- Dynamic imports for player libraries and features
- Lazy-load routes (live, vod, series)

**VIDAA Deployment:**
- Build to static files
- Sideload via vidaa-appstore community tool
- App runs fullscreen in TV's embedded browser engine

## Out of Scope

- Recording/DVR functionality
- Parental controls (PIN, content filtering)
- Multi-language UI (English only for v1.0)
- Catchup/Timeshift TV (watching past programs)
- Backend server/proxy (fully client-side)
- Official VIDAA store submission (sideload only)
- DRM-protected content (standard streams only)

## Tasks

- [x] Initialize Vite project with React 18 and TypeScript
- [x] Configure Tailwind CSS with TV-optimized focus states
- [x] Set up ESLint and Prettier for code quality
- [x] Create base tsconfig with strict mode enabled
- [x] Configure Vite for production builds with code splitting
- [x] Add bundle analyzer plugin for size monitoring
- [x] Create app shell with React Router setup
- [x] Implement Norigin Spatial Navigation provider
- [x] Create VIDAA keymap configuration for remote control keys
- [x] Implement back button handler with exit confirmation
- [x] Create FocusableButton component with TV focus states
- [x] Create FocusableCard component for grid items
- [x] Create Grid component with spatial navigation support
- [x] Create Modal component with focus trapping
- [x] Create Toast component for notifications
- [x] Create Skeleton component for loading states
- [x] Define TypeScript types for Channel, Category, Program
- [x] Define TypeScript types for VOD, Series, Episode
- [x] Define TypeScript types for Source (Xtream and M3U)
- [x] Define TypeScript types for Player state and events
- [x] Implement Xtream Codes API client with authentication
- [x] Implement Xtream client methods for live streams and categories
- [x] Implement Xtream client methods for VOD streams and categories
- [x] Implement Xtream client methods for series and episodes
- [x] Implement Xtream client method for EPG data
- [x] Implement M3U playlist parser wrapper using iptv-m3u-playlist-parser
- [x] Implement M3U adapter to extract channels and categories
- [x] Implement SourceNormalizer to unify Xtream and M3U data formats
- [x] Implement CredentialStore with encrypted localStorage using secure-ls
- [x] Implement MSE/EME capability detection utility
- [x] Implement PlayerAdapter interface for video playback abstraction
- [x] Implement ShakaPlayer adapter with HLS and DASH support
- [x] Implement NativePlayer adapter as fallback for direct streams
- [x] Implement player factory with capability-based selection
- [x] Implement EPG parser for XMLTV format
- [x] Implement EPG cache with time-based invalidation
- [x] Implement EPG time sync utility for accurate program times
- [x] Create Zustand store for source management (add, remove, switch)
- [x] Create Zustand store for channel state (categories, channels, current)
- [x] Create Zustand store for VOD state (categories, movies)
- [x] Create Zustand store for series state (series, seasons, episodes)
- [x] Create Zustand store for EPG state (programs by channel)
- [x] Create Zustand store for player state (playing, volume, quality)
- [x] Create Zustand store for settings (quality preferences, buffer size)
- [x] Create React Query hooks for fetching channels with caching
- [x] Create React Query hooks for fetching VOD content
- [x] Create React Query hooks for fetching series content
- [x] Create React Query hooks for fetching EPG data
- [x] Build SourceSetup screen for first-launch onboarding
- [x] Build XtreamLoginForm component with server/username/password fields
- [x] Build M3UUrlForm component with URL input and validation
- [x] Build AddSourceModal for adding new IPTV sources
- [x] Build SourceList component for managing saved sources
- [x] Build HomePage with main menu (Live TV, VOD, Series, EPG, Settings)
- [x] Build MenuCard component for home screen navigation
- [x] Build LiveTVPage with category sidebar and channel grid
- [x] Build CategoryList component with vertical navigation
- [x] Build ChannelGrid component with focusable channel cards
- [x] Build ChannelCard component showing logo, name, and now playing
- [x] Build VODPage with category browsing and movie grid
- [x] Build VODCard component with poster and title
- [x] Build VODDetails modal with movie info and play button
- [x] Build SeriesPage with series grid browsing
- [x] Build SeriesCard component with poster and title
- [x] Build SeriesDetails screen with season and episode selection
- [x] Build SeasonList component for season navigation
- [x] Build EpisodeList component with episode cards
- [x] Build EPGPage with full program guide grid
- [x] Build EPGGrid component with timeline and channel rows
- [x] Build EPGProgram component for individual program cells
- [x] Build MiniEPG component showing now/next for current channel
- [x] Build ProgramDetails modal with program information
- [x] Build VideoPlayer component with Shaka integration
- [x] Build PlayerControls component (play/pause, seek, volume)
- [x] Build PlayerOverlay component showing channel info
- [x] Build QualitySelector component for stream quality selection
- [x] Implement player remote control handling (play/pause, channel up/down)
- [x] Build SettingsPage with sections for playback and sources
- [x] Build PlaybackSettings component (quality, buffer size)
- [x] Build SourceSettings component for managing IPTV sources
- [x] Build AboutSection component with app version info
- [x] Implement global error boundary with recovery UI
- [x] Implement stream error handling with retry logic
- [x] Implement source validation on add (test connection)
- [x] Write unit tests for Xtream Codes API client
- [x] Write unit tests for M3U parser adapter
- [x] Write unit tests for SourceNormalizer
- [x] Write unit tests for PlayerAdapter implementations
- [x] Write unit tests for EPG parser and cache
- [x] Write unit tests for CredentialStore encryption
- [x] Create app icons (220x220 and 400x400 PNG)
- [x] Configure Vite build for production optimization
- [x] Create sideload documentation with step-by-step instructions
- [x] Test full app flow on actual VIDAA TV device
- [x] Fix any TV-specific navigation or playback issues

## Acceptance Criteria

- User can add an Xtream Codes source with server URL, username, and password
- User can add an M3U playlist source with URL
- User can save multiple IPTV sources and switch between them
- User can browse live TV channels organized by category
- User can play live TV streams with basic controls (play/pause)
- User can browse VOD movies by category and play them
- User can browse series, select seasons, and play episodes
- User can view EPG grid showing current and upcoming programs
- User can navigate entire app using only TV remote (D-pad + OK + Back)
- App correctly handles Back button (go back or show exit confirmation at root)
- Credentials are stored encrypted on the device
- App loads initial shell in under 3 seconds on VIDAA TV
- Video playback starts within 5 seconds of channel selection
- App can be sideloaded onto VIDAA TV using documented process
