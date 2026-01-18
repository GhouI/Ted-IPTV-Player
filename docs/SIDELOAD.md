# Ted IPTV Player - Sideload Guide for VIDAA TVs

This guide provides step-by-step instructions for sideloading Ted IPTV Player onto your Hisense/VIDAA smart TV.

## Prerequisites

Before you begin, ensure you have:

- A Hisense smart TV running VIDAA OS
- A computer on the same network as your TV
- Node.js 18+ installed on your computer
- Basic familiarity with command line operations

## Step 1: Build the Application

First, clone and build the Ted IPTV Player application:

```bash
# Clone the repository
git clone https://github.com/your-repo/ted.git
cd ted

# Install dependencies
npm install

# Build for production
npm run build
```

The built files will be in the `dist/` directory.

## Step 2: Enable Developer Mode on VIDAA TV

1. On your TV remote, press the **Settings** button
2. Navigate to **System** > **About**
3. Select **Device ID** and note it down
4. Go back to **System** > **Advanced Settings** > **Developer Mode**
5. Enable **Developer Mode**
6. Note your TV's IP address from **Network** > **Network Status**

## Step 3: Install vidaa-appstore Tool

The vidaa-appstore community tool allows sideloading apps onto VIDAA TVs:

```bash
# Install the vidaa-appstore tool globally
npm install -g vidaa-appstore
```

## Step 4: Prepare the App Package

Create a VIDAA-compatible app package:

1. Create an `app.json` manifest file in your `dist/` directory:

```json
{
  "id": "ted.iptv.player",
  "version": "0.1.0",
  "name": "Ted IPTV",
  "description": "Open-source IPTV player",
  "icon": "icon-220x220.png",
  "main": "index.html",
  "type": "web"
}
```

2. Your `dist/` directory structure should look like:

```
dist/
├── app.json
├── index.html
├── icon-220x220.png
├── icon-400x400.png
├── favicon.png
├── favicon-16.png
└── assets/
    ├── index-[hash].js
    └── index-[hash].css
```

## Step 5: Deploy to Your TV

Use vidaa-appstore to deploy the app:

```bash
# Navigate to the dist directory
cd dist

# Deploy to your TV (replace with your TV's IP)
vidaa-appstore deploy --ip YOUR_TV_IP --path .
```

Alternatively, if using a manual approach:

```bash
# Create a zip package
cd dist
zip -r ted-iptv.zip .

# Use vidaa-appstore to install
vidaa-appstore install --ip YOUR_TV_IP --package ted-iptv.zip
```

## Step 6: Launch the App

1. On your TV, go to **Apps** or **My Apps**
2. Look for **Ted IPTV** in your app list
3. Select and launch the application
4. On first launch, you'll be prompted to add an IPTV source

## Troubleshooting

### App Not Appearing After Install

- Restart your TV
- Ensure Developer Mode is still enabled
- Check that your TV and computer are on the same network

### Connection Refused Errors

- Verify the TV's IP address is correct
- Ensure no firewall is blocking the connection
- Try restarting the Developer Mode on your TV

### App Crashes on Launch

- Ensure you built with `npm run build` (production mode)
- Check that all files are present in the dist folder
- Verify the app.json manifest is correctly formatted

### Video Playback Issues

- VIDAA's browser engine may have limitations with certain codecs
- Ensure your IPTV streams use H.264/AVC video codec
- HLS (.m3u8) streams generally work best

### Remote Control Not Working

- The app uses standard VIDAA key codes
- If navigation doesn't work, try relaunching the app
- Use D-pad for navigation, OK to select, Back to go back

## Uninstalling the App

To remove Ted IPTV from your TV:

```bash
vidaa-appstore uninstall --ip YOUR_TV_IP --id ted.iptv.player
```

Or manually through your TV:
1. Go to **Apps** > **My Apps**
2. Find **Ted IPTV**
3. Press and hold or select options
4. Choose **Uninstall** or **Remove**

## Updating the App

To update to a new version:

1. Build the new version: `npm run build`
2. Redeploy: `vidaa-appstore deploy --ip YOUR_TV_IP --path dist/`

The app will be updated in place, preserving your saved sources and settings.

## Hosting the App (Alternative Method)

Instead of sideloading, you can host the app on a web server:

1. Build the app: `npm run build`
2. Host the `dist/` folder on any static web server
3. On your VIDAA TV, open the built-in browser
4. Navigate to your hosted URL
5. Bookmark for easy access

This method doesn't require Developer Mode but may have some limitations compared to sideloading.

## Security Notes

- Ted IPTV Player stores credentials encrypted locally on your TV
- No data is sent to external servers (fully client-side)
- Always obtain IPTV subscriptions from legitimate providers
- The app does not facilitate access to pirated content

## Support

For issues and feature requests, please visit the project's GitHub repository.
