# Armadarr Card

A custom Home Assistant Lovelace card to display upcoming and wanted media from the Armadarr integration. Inspired by the `upcoming-media-card`, this card provides a modern, interactive interface for your media management.

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg?style=for-the-badge)](https://github.com/hacs/integration)
![Version](https://img.shields.io/github/v/release/totaldebug/armadarr-card?style=for-the-badge)
![License](https://img.shields.io/github/license/totaldebug/armadarr-card?style=for-the-badge)

## Features

- **Dynamic Media Display**: Automatically shows upcoming or wanted media from Sonarr, Radarr, Lidarr, and Readarr via the Armadarr integration.
- **Two Distinct Layouts**:
  - **Poster View**: Classic vertical posters with a sleek side-info panel.
  - **Fanart View**: Wide horizontal banners with a cinematic feel.
- **Interactive Requesting**: For "Wanted" media, a one-click "Request" button triggers a search in the respective application directly from your dashboard.
- **Smart Collapsing**: Keep your dashboard tidy with configurable item limits for collapsed and expanded states.
- **Rich Tooltips**: Hover over any item to see the full media summary in a beautiful, blurred backdrop tooltip.
- **Trailer Integration**: Direct links to YouTube trailers (if provided by the integration) via a play icon.
- **Custom Navigation**: Use `url_pattern` to define exactly where you want to go when clicking a media item (e.g., Plex, Jellyfin, or a metadata site).
- **Fully Themeable**: Every element is assigned specific CSS classes, making it a dream for `card-mod` enthusiasts.

## Screenshots

| Poster View | Fanart View |
| :---: | :---: |
| ![Poster View Placeholder](https://raw.githubusercontent.com/totaldebug/armadarr-card/main/screenshots/poster_view.png) | ![Fanart View Placeholder](https://raw.githubusercontent.com/totaldebug/armadarr-card/main/screenshots/fanart_view.png) |

*Note: Screenshots are illustrative. Actual appearance depends on your Home Assistant theme.*

## Installation

### HACS (Recommended)
1. Open HACS in Home Assistant.
2. Click on "Frontend".
3. Click the three dots in the top right and select "Custom repositories".
4. Add `https://github.com/totaldebug/armadarr-card` with category `Lovelace`.
5. Click "Install" on the Armadarr Card.

### Manual
1.  **Build the card**:
    ```bash
    pnpm install
    pnpm run build
    ```
2.  **Upload to Home Assistant**:
    Copy `dist/armadarr-card.js` to your Home Assistant `www/` directory (e.g., `/config/www/armadarr-card.js`).
3.  **Add as Resource**:
    Add the following to your Lovelace resources:
    - URL: `/local/armadarr-card.js`
    - Type: `JavaScript Module`

## Configuration Options

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `type` | string | **Required** | Must be `custom:armadarr-card`. |
| `entity` | string | **Required** | The Armadarr sensor entity (e.g., `sensor.sonarr_upcoming_media`). |
| `title` | string | Optional | Title displayed at the top of the card. |
| `image_style` | string | `poster` | Image style to display: `poster` or `fanart`. |
| `max` | number | `5` | Maximum number of items to show in total (up to 50). |
| `collapse` | number | `5` | Number of items to show before showing the expand/collapse toggle. |
| `url_pattern` | string | Optional | URL pattern for clicking items. Use `{title}` as a placeholder for the media title. |

## Example Usage

```yaml
type: custom:armadarr-card
entity: sensor.sonarr_upcoming_media
title: Upcoming TV Shows
image_style: poster
max: 10
collapse: 5
url_pattern: "https://www.thetvdb.com/search?query={title}"
```

## CSS Classes for Styling (Card Mod)

You can use `card-mod` to target these classes for custom styling:

- `.armadarr-card`: The main card container.
- `.armadarr-card-container`: Inner container for padding and layout.
- `.armadarr-card-header`: Container for the title and collapse toggle.
- `.armadarr-header`: The card title text.
- `.armadarr-collapse-control`: The expand/collapse icon button.
- `.armadarr-collapse-icon`: The icon inside the collapse control.
- `.armadarr-list`: The container for all media items.
- `.armadarr-item`: Individual media item container (also has `.armadarr-poster-item` or `.armadarr-fanart-item`).
- `.armadarr-image-container`: Container for the poster image.
- `.armadarr-image`: The actual poster image element.
- `.armadarr-fanart-container`: Container for the fanart background.
- `.armadarr-fanart-fade`: The gradient fade overlay on fanart.
- `.armadarr-info`: The text information panel.
- `.armadarr-title`: Media title text.
- `.armadarr-subtitle`: Media subtitle (episode name, airdate, etc.).
- `.armadarr-meta`: Container for metadata (rating, genres, studio).
- `.armadarr-meta-item`: Base class for all metadata items.
- `.armadarr-airdate`: Airdate metadata element.
- `.armadarr-number`: Season/Episode number metadata element.
- `.armadarr-rating`: Rating (star) metadata element.
- `.armadarr-studio`: Studio metadata element.
- `.armadarr-genres`: Genre list text.
- `.armadarr-request-action`: The request button (has `.requesting`, `.requested`, or `.error` states).
- `.armadarr-request-icon`: The icon inside the request button.
- `.armadarr-request-progress`: The loading spinner during a request.
- `.armadarr-trailer`: The trailer link container.
- `.armadarr-trailer-icon`: The play icon for trailers.

### Global Styling (Non-Shadow DOM)
The following classes are applied to elements outside the card's Shadow DOM (e.g., tooltips) and may require global CSS or theme-level styling:

- `.armadarr-tooltip`: The main hover tooltip container.
- `.armadarr-tooltip-title`: Title inside the tooltip.
- `.armadarr-tooltip-summary`: Summary text inside the tooltip.

## Development

If you want to contribute or modify the card:

1. Clone the repo.
2. `pnpm install`
3. `pnpm run watch` (for development with auto-rebuild)
4. `pnpm run build` (for production build)

---
*Inspired by the original `upcoming-media-card` by @custom-cards.*
