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
- [ ] Implement back button handler with exit confirmation
- [ ] Create FocusableButton component with TV focus states
- [ ] Create FocusableCard component for grid items
- [ ] Create Grid component with spatial navigation support
- [ ] Create Modal component with focus trapping
- [ ] Create Toast component for notifications
- [ ] Create Skeleton component for loading states
- [ ] Define TypeScript types for Channel, Category, Program
- [ ] Define TypeScript types for VOD, Series, Episode
- [ ] Define TypeScript types for Source (Xtream and M3U)
- [ ] Define TypeScript types for Player state and events
- [ ] Implement Xtream Codes API client with authentication
- [ ] Implement Xtream client methods for live streams and categories
- [ ] Implement Xtream client methods for VOD streams and categories
- [ ] Implement Xtream client methods for series and episodes
- [ ] Implement Xtream client method for EPG data
- [ ] Implement M3U playlist parser wrapper using iptv-m3u-playlist-parser
- [ ] Implement M3U adapter to extract channels and categories
- [ ] Implement SourceNormalizer to unify Xtream and M3U data formats
- [ ] Implement CredentialStore with encrypted localStorage using secure-ls
- [ ] Implement MSE/EME capability detection utility
- [ ] Implement PlayerAdapter interface for video playback abstraction
- [ ] Implement ShakaPlayer adapter with HLS and DASH support
- [ ] Implement NativePlayer adapter as fallback for direct streams
- [ ] Implement player factory with capability-based selection
- [ ] Implement EPG parser for XMLTV format
- [ ] Implement EPG cache with time-based invalidation
- [ ] Implement EPG time sync utility for accurate program times
- [ ] Create Zustand store for source management (add, remove, switch)
- [ ] Create Zustand store for channel state (categories, channels, current)
- [ ] Create Zustand store for VOD state (categories, movies)
- [ ] Create Zustand store for series state (series, seasons, episodes)
- [ ] Create Zustand store for EPG state (programs by channel)
- [ ] Create Zustand store for player state (playing, volume, quality)
- [ ] Create Zustand store for settings (quality preferences, buffer size)
- [ ] Create React Query hooks for fetching channels with caching
- [ ] Create React Query hooks for fetching VOD content
- [ ] Create React Query hooks for fetching series content
- [ ] Create React Query hooks for fetching EPG data
- [ ] Build SourceSetup screen for first-launch onboarding
- [ ] Build XtreamLoginForm component with server/username/password fields
- [ ] Build M3UUrlForm component with URL input and validation
- [ ] Build AddSourceModal for adding new IPTV sources
- [ ] Build SourceList component for managing saved sources
- [ ] Build HomePage with main menu (Live TV, VOD, Series, EPG, Settings)
- [ ] Build MenuCard component for home screen navigation
- [ ] Build LiveTVPage with category sidebar and channel grid
- [ ] Build CategoryList component with vertical navigation
- [ ] Build ChannelGrid component with focusable channel cards
- [ ] Build ChannelCard component showing logo, name, and now playing
- [ ] Build VODPage with category browsing and movie grid
- [ ] Build VODCard component with poster and title
- [ ] Build VODDetails modal with movie info and play button
- [ ] Build SeriesPage with series grid browsing
- [ ] Build SeriesCard component with poster and title
- [ ] Build SeriesDetails screen with season and episode selection
- [ ] Build SeasonList component for season navigation
- [ ] Build EpisodeList component with episode cards
- [ ] Build EPGPage with full program guide grid
- [ ] Build EPGGrid component with timeline and channel rows
- [ ] Build EPGProgram component for individual program cells
- [ ] Build MiniEPG component showing now/next for current channel
- [ ] Build ProgramDetails modal with program information
- [ ] Build VideoPlayer component with Shaka integration
- [ ] Build PlayerControls component (play/pause, seek, volume)
- [ ] Build PlayerOverlay component showing channel info
- [ ] Build QualitySelector component for stream quality selection
- [ ] Implement player remote control handling (play/pause, channel up/down)
- [ ] Build SettingsPage with sections for playback and sources
- [ ] Build PlaybackSettings component (quality, buffer size)
- [ ] Build SourceSettings component for managing IPTV sources
- [ ] Build AboutSection component with app version info
- [ ] Implement global error boundary with recovery UI
- [ ] Implement stream error handling with retry logic
- [ ] Implement source validation on add (test connection)
- [ ] Write unit tests for Xtream Codes API client
- [ ] Write unit tests for M3U parser adapter
- [ ] Write unit tests for SourceNormalizer
- [ ] Write unit tests for PlayerAdapter implementations
- [ ] Write unit tests for EPG parser and cache
- [ ] Write unit tests for CredentialStore encryption
- [ ] Create app icons (220x220 and 400x400 PNG)
- [ ] Configure Vite build for production optimization
- [ ] Create sideload documentation with step-by-step instructions
- [ ] Test full app flow on actual VIDAA TV device
- [ ] Fix any TV-specific navigation or playback issues

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
