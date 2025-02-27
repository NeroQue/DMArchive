# DMArchive

A BetterDiscord plugin that allows you to archive your Discord DM conversations into readable HTML files.

## Features

- Archive entire DM conversations with a single click
- Preserves message formatting (bold, italic, underline, etc.)
- Includes images, attachments, and embeds
- Maintains message timestamps and author information
- Creates clean, organized HTML files for easy viewing
- Supports user avatars and profile pictures
- Dark theme design that matches Discord's aesthetic

## Installation

1. Make sure you have [BetterDiscord](https://betterdiscord.app/) installed
2. Download `dmarchive.plugin.js`
3. Move the plugin file to your BetterDiscord plugins folder:
   - Windows: `%appdata%/BetterDiscord/plugins/`
   - Linux: `~/.config/BetterDiscord/plugins/`
   - macOS: `~/Library/Application Support/BetterDiscord/plugins/`
4. Enable the plugin in BetterDiscord settings

## Usage

1. Open any DM conversation in Discord
2. Look for the "Archive DM" button in the top toolbar
3. Click the button to start archiving
4. Wait for the process to complete
5. The archived conversation will be automatically downloaded as an HTML file

The archived file will be named in the format: `discord_dm_USERNAME_YYYY-MM-DD.html`

## Features of the Archive

The archived HTML file includes:
- Complete message history
- User avatars
- Message timestamps
- Formatted text (bold, italic, code blocks, etc.)
- Images and attachments
- Embeds
- Links
- File attachments with size information

## Debug Mode

To enable debug mode for troubleshooting:
1. Open Discord Developer Tools (Ctrl+Shift+I)
2. Type in console: `BdApi.getPlugin('DMArchive').toggleDebug()`

## Requirements

- BetterDiscord
- A modern web browser to view the archived files
- Discord desktop client

## Known Limitations

- Can only archive direct messages (DMs), not group chats or servers
- Large conversations may take some time to archive
- Some Discord-specific features (reactions, replies) may have limited support

## Version

Current Version: 0.1.0

## Author

Created by NeroQue

## License

This project is open source and available under the MIT License.

## Support

If you encounter any issues or have suggestions, please open an issue on the project's repository. 