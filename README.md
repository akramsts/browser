<div align="center">

<img src="browser-192.png" width="96" height="96" alt="Browser logo">

# Browser

**Privacy-first start page. Fast search, clean UI, local history, and offline installability.**

No tracking · No ads · No analytics

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Supported Search Engines](#supported-search-engines)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Pages](#pages)
- [How It Works](#how-it-works)
- [Deployment](#deployment)
- [Notes](#notes)
- [License](#license)
- [Author](#author)

---

## Overview

Browser is a lightweight, installable start page built with plain HTML, CSS, and JavaScript. It delivers a distraction-free search experience, lets users choose a preferred search engine, and stores settings and history entirely in the browser.

This app is designed for speed, privacy, and simplicity.

## Features

- Clean search interface with instant results
- URL detection: type a URL and navigate directly
- Local search history with grouping, filtering, and deletion
- Smart suggestion dropdown from recent searches
- Light / Dark / System theme support
- Voice search via Web Speech API when available
- Installable PWA with offline caching
- Dedicated pages for settings, history, apps, downloads, and about
- Responsive design for mobile and desktop

## Supported Search Engines

- DuckDuckGo (default)
- Startpage
- Brave
- Ecosia
- Bing
- Yahoo
- Google

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- `localStorage` for preferences and history
- Service Worker for offline caching
- Web App Manifest for installability

## Project Structure

```
browser/
├── index.html            # Main search start page
├── settings.html         # Theme and search engine preferences
├── history.html          # Full search history with filtering and delete
├── apps.html             # VSearch & VSave companion apps
├── downloads.html        # Gree Runner game — play or download
├── about.html            # App info and version details
├── style.css             # Styles for the main search page
├── pages.css             # Shared styles for secondary pages
├── script.js             # Search, history, and voice logic
├── theme.js              # Theme detection and switching
├── browser-sw.js         # Service worker (offline caching)
├── browser-manifest.json # PWA manifest
├── browser-192.png       # App icon (192x192)
├── browser-512.png       # App icon (512x512)
└── README.md
```

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/akramsts/browser.git
cd browser
```

2. Run a local static server:

```bash
npx serve .
```

3. Open the served site in your browser.

> For full PWA and service worker support, use a local server or HTTPS host. Opening `index.html` directly with `file:///` may disable offline features.

## Usage

- Type a query and press `Enter` to search.
- Type a URL to open it directly.
- Press `Shift + Enter` to open search in a new tab.
- Customize default engine and theme in `settings.html`.
- Manage search history in `history.html`.
- Install the app from the browser prompt.

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `↑` / `↓` | Cycle through search history suggestions |
| `Enter` | Search |
| `Shift + Enter` | Open search in a new tab |
| `Ctrl/Cmd + K` | Focus the search box |
| `Ctrl/Cmd + L` | Focus and select the search box |
| `Esc` | Clear input / close open menus |

## Pages

| Page | Description |
|---|---|
| `index.html` | Main search start page |
| `settings.html` | Choose theme and search engine |
| `history.html` | View and manage search history |
| `apps.html` | Companion app downloads |
| `downloads.html` | Gree Runner play/download page |
| `about.html` | App information and credits |

## How It Works

- **Search / URL detection** — input is parsed as a URL when it matches URL-like patterns. Otherwise the app searches using the selected engine.
- **Local history** — searches are saved in `localStorage` as entries with `query`, `time`, and `engine`.
- **Theme system** — `theme.js` applies light, dark, or system theme and keeps it synced across tabs.
- **Offline support** — `browser-sw.js` pre-caches core pages, styles, scripts, and icons so the app can load offline after first visit.

## Deployment

This is a static web app and can be hosted on any static hosting service:

- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting
- Any static file server

## Notes

- Voice search requires browser support for the Web Speech API.
- All settings and history are stored locally in the browser.
- Nothing is sent to a server.

## License

Available for personal and educational use. Feel free to fork and customize it for your own start page.

## Author

Made by **Akram**
