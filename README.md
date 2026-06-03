# Calendar Pro

A calendar view combined with a heatmap for diary and weekly note management.

## Features

- **Dual View Toggle**: Switch seamlessly between calendar view and heatmap view
- **Diary Management**: Click any date to quickly create or open a diary entry with template variable support
- **Weekly Notes**: Dedicated weekly note folder with clickable week labels for easy creation and access
- **Word Count Statistics**: Chinese and English word counting with automatic frontmatter filtering
- **Staircase Dots**: Visual dot markers below calendar dates that progressively fill as word count increases
- **Heatmap Legend**: 5-tier color thresholds for intuitive writing density visualization
- **Keyboard Navigation**: Use `←` and `→` arrow keys to switch months/years quickly
- **Light & Dark Themes**: Automatically adapts to Obsidian's light and dark themes

## Installation

### Method 1: BRAT (Recommended)

1. Install the [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin
2. Open the command palette → `BRAT: Add a beta plugin for testing`
3. Enter `https://github.com/kuzen-so/calendar-pro`
4. Click `Add Plugin`

### Method 2: Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest Release
2. Create the folder `.obsidian/plugins/calendar-pro/` in your Obsidian vault
3. Place the downloaded 3 files into that folder
4. Restart Obsidian and enable "Calendar Pro" in **Settings → Community Plugins**

## Usage

- Click the **calendar icon** in the left sidebar to open the view
- Click a date cell to open or create a diary entry
- Right-click a date with an existing diary to delete it or copy its path
- Click a week label number to open or create a weekly note
- Press `←` / `→` keys to navigate between months/years

## Settings

Go to **Settings → Community Plugins → Calendar Pro → Options**:

| Setting | Description |
|---------|-------------|
| Use Custom Diary Config | Override the Daily Notes plugin configuration |
| Diary Folder | Path where diary entries are stored |
| Date Format | Moment.js format, e.g. `YYYY-MM-DD` |
| Weekly Note Folder | Separate folder for weekly notes |
| Week Start Day | Which day marks the beginning of a week |
| Show Week Numbers | Display week number labels on the left side of the calendar |
| Heatmap Color Thresholds | 5-tier word count thresholds, default: 50/150/300/500/800 |

## Command Palette

- `Calendar Pro: Open Calendar Pro`
- `Calendar Pro: Close Calendar Pro`
- `Calendar Pro: Jump to Today`

## Compatibility

- Minimum Obsidian version: v0.15.0
- Supports both desktop and mobile

## License

MIT
