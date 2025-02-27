/**
 * @name DMArchive
 * @author NeroQue
 * @description Archive DMs
 * @version 0.1.0
 */

module.exports = class DMArchive {
    constructor() {
        // Initialize variables
        this.initialized = false;
        this.style = null;
        this.observer = null;
        this.buttonRef = null;
        this.debugMode = false; // Show debug messages
    }

    start() {
        // Called when the plugin is activated
        console.log("DMArchive plugin started");
        BdApi.showToast("DMArchive plugin started", {type: "info"});
        this.initialize();
    }

    stop() {
        // Called when the plugin is deactivated
        console.log("DMArchive plugin stopped");
        this.shutdown();
    }

    initialize() {
        // Add button style
        this.style = document.createElement('style');
        this.style.textContent = `
            .dm-archive-button {
                margin: 0 8px;
                padding: 4px 8px;
                background-color: #5865F2;
                color: white;
                border-radius: 3px;
                cursor: pointer;
                font-weight: 500;
                font-size: 14px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                height: 24px;
                min-width: auto;
            }
            .dm-archive-button:hover {
                background-color: #4752C4;
            }
        `;
        document.head.appendChild(this.style);
        
        // Watch for DM channel changes
        this.observer = new MutationObserver((mutations) => {
            // Check if we're in a DM channel
            if (this.isDMChannel()) {
                this.addButtonToCurrentDM();
            }
        });
        
        // Start watching for changes to the URL/channel
        this.observer.observe(document.body, { childList: true, subtree: true });
        
        // Add button to current DM if we're already in one
        if (this.isDMChannel()) {
            this.addButtonToCurrentDM();
        }
        
        // Listen for URL changes to detect DM switches
        this.setupURLChangeListener();
        
        this.initialized = true;
    }

    setupURLChangeListener() {
        // Create a listener for URL changes
        var self = this;
        var lastUrl = window.location.href;
        
        // Check URL every 1 second
        setInterval(function() {
            if (lastUrl !== window.location.href) {
                lastUrl = window.location.href;
                // If we switched to a DM
                if (self.isDMChannel()) {
                    self.addButtonToCurrentDM();
                } else {
                    // Remove button if we're not in a DM
                    self.removeButton();
                }
            }
        }, 1000);
    }

    shutdown() {
        // Stop watching for changes
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        
        // Remove our button style
        if (this.style) {
            this.style.remove();
            this.style = null;
        }
        
        // Remove the button
        this.removeButton();
        
        this.initialized = false;
    }

    removeButton() {
        // Remove the button if it exists
        if (this.buttonRef && this.buttonRef.parentNode) {
            this.buttonRef.remove();
            this.buttonRef = null;
        }
    }

    addButtonToCurrentDM() {
        // Get the DM channel ID
        var channelId = this.getCurrentChannelId();
        if (!channelId) {
            this.debugLog("Could not find channel ID");
            return;
        }
        
        this.debugLog("Current channel ID: " + channelId);
        
        // Find the toolbar
        var toolbar = document.querySelector('[class*="toolbar_"]');
        if (!toolbar) {
            this.debugLog("Toolbar not found");
            return;
        }
        
        this.debugLog("Found toolbar: " + toolbar.className);
        
        // Check if our button already exists
        var existingButton = toolbar.querySelector(".dm-archive-button");
        if (existingButton) {
            this.debugLog("Button already exists");
            // Update the button's onclick to use the current channel ID
            var self = this;
            existingButton.onclick = function() {
                self.archiveDM(channelId);
            };
            return;
        }
        
        // Create our button
        var archiveButton = document.createElement('button');
        archiveButton.className = 'dm-archive-button';
        archiveButton.textContent = 'Archive DM';
        
        // Add click function
        var self = this;
        archiveButton.onclick = function() {
            self.archiveDM(channelId);
        };
        
        // Add button to the beginning of the toolbar
        toolbar.insertBefore(archiveButton, toolbar.firstChild);
        this.debugLog("Button added to toolbar for channel " + channelId);
        
        // Save button reference
        this.buttonRef = archiveButton;
        BdApi.showToast("Archive button added", {type: "success"});
    }

    getCurrentChannelId() {
        // Get channel ID from URL
        var url = window.location.href;
        var match = url.match(/\/channels\/@me\/(\d+)/);
        if (match) {
            return match[1];
        } else {
            return null;
        }
    }

    isDMChannel() {
        // Check if we're in a DM
        var url = window.location.href;
        if (url.includes('/channels/@me/')) {
            return true;
        } else {
            return false;
        }
    }

    archiveDM(channelId) {
        // Show a loading toast
        BdApi.showToast("Archiving DM channel...", {type: "info"});
        this.debugLog("Starting archive process for channel: " + channelId);
        
        // Get messages from the channel
        this.fetchMessages(channelId)
            .then(messages => {
                // Create HTML archive
                const html = this.createArchiveHTML(messages, channelId);
                
                // Save the HTML file
                this.saveArchive(html, channelId);
            })
            .catch(error => {
                console.error("[DMArchive] Error archiving DM:", error);
                BdApi.showToast("Failed to archive DM: " + error.message, {type: "error"});
            });
    }
    
    // Print debug messages
    debugLog(message) {
        if (this.debugMode) {
            console.log("[DMArchive] " + message);
        }
    }
    
    // Turn debug mode on/off
    toggleDebug() {
        this.debugMode = !this.debugMode;
        BdApi.showToast("Debug mode " + (this.debugMode ? "enabled" : "disabled"), {type: "info"});
        return this.debugMode;
    }

    async fetchMessages(channelId) {
        this.debugLog("Fetching messages for channel: " + channelId);
        
        // We'll use Discord's API to get messages
        // First, we need to get the Discord token
        let token = this.getDiscordToken();
        if (!token) {
            throw new Error("Could not get Discord token");
        }
        
        let messages = [];
        let lastMessageId = null;
        let hasMoreMessages = true;
        
        // Show progress toast
        BdApi.showToast("Fetching messages...", {type: "info"});
        
        // Fetch messages in batches of 100 (Discord's limit)
        while (hasMoreMessages) {
            let url = `https://discord.com/api/v9/channels/${channelId}/messages?limit=100`;
            if (lastMessageId) {
                url += `&before=${lastMessageId}`;
            }
            
            try {
                const response = await fetch(url, {
                    headers: {
                        'Authorization': token,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`API returned status ${response.status}`);
                }
                
                const batch = await response.json();
                this.debugLog(`Fetched ${batch.length} messages`);
                
                if (batch.length === 0) {
                    hasMoreMessages = false;
                } else {
                    messages = messages.concat(batch);
                    lastMessageId = batch[batch.length - 1].id;
                    
                    // If we have a lot of messages, show progress
                    if (messages.length % 500 === 0) {
                        BdApi.showToast(`Fetched ${messages.length} messages so far...`, {type: "info"});
                    }
                    
                    // Add a small delay to avoid rate limits
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            } catch (error) {
                console.error("[DMArchive] Error fetching messages:", error);
                throw error;
            }
        }
        
        this.debugLog(`Total messages fetched: ${messages.length}`);
        return messages;
    }

    getDiscordToken() {
        // Try to get the token from localStorage
        let token = undefined;
        
        // Method 1: From localStorage
        try {
            token = JSON.parse(localStorage.getItem('token'));
            if (token) return token;
        } catch (e) {}
        
        // Method 2: From localStorage in quotes
        try {
            token = localStorage.getItem('token');
            if (token && token.startsWith('"') && token.endsWith('"')) {
                token = JSON.parse(token);
            }
            if (token) return token;
        } catch (e) {}
        
        // Method 3: From application's webpackJsonp
        try {
            const webpackChunkdiscord_app = window.webpackChunkdiscord_app || [];
            webpackChunkdiscord_app.push([
                [Math.random()], 
                {}, 
                (req) => {
                    for (const m of Object.keys(req.c).map(x => req.c[x].exports).filter(x => x)) {
                        if (m.default && m.default.getToken !== undefined) {
                            token = m.default.getToken();
                            break;
                        }
                        if (m.getToken !== undefined) {
                            token = m.getToken();
                            break;
                        }
                    }
                }
            ]);
            if (token) return token;
        } catch (e) {}
        
        return null;
    }

    createArchiveHTML(messages, channelId) {
        this.debugLog("Creating HTML archive for " + messages.length + " messages");
        
        // Get DM recipient info
        const recipient = this.getDMRecipient(channelId);
        const dmName = recipient ? recipient.username : "Unknown User";
        
        // Sort messages by timestamp (oldest first)
        messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // Create HTML content
        let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Discord DM Archive - ${dmName}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #36393f;
            color: #dcddde;
            margin: 0;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            padding: 10px;
            background-color: #2f3136;
            border-radius: 5px;
        }
        .message {
            display: flex;
            margin-bottom: 16px;
            padding: 8px;
            border-radius: 5px;
        }
        .message:hover {
            background-color: #32353b;
        }
        .avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            margin-right: 16px;
        }
        .message-content {
            flex-grow: 1;
        }
        .author {
            font-weight: bold;
            margin-bottom: 4px;
        }
        .timestamp {
            color: #72767d;
            font-size: 0.8em;
            margin-left: 8px;
        }
        .text {
            margin-bottom: 8px;
            white-space: pre-wrap;
        }
        .attachment {
            max-width: 400px;
            max-height: 300px;
            border-radius: 3px;
            margin-top: 8px;
        }
        .embed {
            border-left: 4px solid #4f545c;
            padding-left: 12px;
            margin-top: 8px;
            background-color: #2f3136;
            border-radius: 4px;
            padding: 8px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Discord DM Archive - ${dmName}</h1>
        <p>Archived on ${new Date().toLocaleString()}</p>
        <p>Total Messages: ${messages.length}</p>
    </div>
    <div class="messages">
`;

        // Add each message to the HTML
        messages.forEach(message => {
            const timestamp = new Date(message.timestamp).toLocaleString();
            const authorName = message.author.username;
            const authorAvatar = message.author.avatar 
                ? `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.png` 
                : 'https://cdn.discordapp.com/embed/avatars/0.png';
            
            html += `
            <div class="message">
                <img class="avatar" src="${authorAvatar}" alt="${authorName}'s avatar">
                <div class="message-content">
                    <div class="author">${authorName}<span class="timestamp">${timestamp}</span></div>
                    <div class="text">${this.formatMessageContent(message.content)}</div>
`;

            // Add attachments (images, files, etc.)
            if (message.attachments && message.attachments.length > 0) {
                message.attachments.forEach(attachment => {
                    if (attachment.content_type && attachment.content_type.startsWith('image/')) {
                        html += `<img class="attachment" src="${attachment.url}" alt="Attachment">`;
                    } else {
                        html += `<div><a href="${attachment.url}" target="_blank">${attachment.filename}</a> (${this.formatFileSize(attachment.size)})</div>`;
                    }
                });
            }
            
            // Add embeds
            if (message.embeds && message.embeds.length > 0) {
                message.embeds.forEach(embed => {
                    html += `<div class="embed">`;
                    
                    if (embed.title) {
                        html += `<div style="font-weight: bold;">${embed.title}</div>`;
                    }
                    
                    if (embed.description) {
                        html += `<div>${embed.description}</div>`;
                    }
                    
                    if (embed.image) {
                        html += `<img class="attachment" src="${embed.image.url}" alt="Embed Image">`;
                    }
                    
                    html += `</div>`;
                });
            }
            
            html += `
                </div>
            </div>`;
        });
        
        // Close HTML tags
        html += `
        </div>
    </body>
</html>`;

        return html;
    }

    formatMessageContent(content) {
        if (!content) return '';
        
        // Replace HTML special characters
        let formatted = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        // Simple formatting for bold, italic, etc.
        formatted = formatted
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/~~(.*?)~~/g, '<del>$1</del>')
            .replace(/__(.*?)__/g, '<u>$1</u>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
        
        // Convert URLs to links
        formatted = formatted.replace(
            /(https?:\/\/[^\s]+)/g, 
            '<a href="$1" target="_blank">$1</a>'
        );
        
        // Convert newlines to <br>
        formatted = formatted.replace(/\n/g, '<br>');
        
        return formatted;
    }

    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' bytes';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }

    getDMRecipient(channelId) {
        try {
            // Get required Discord modules through BdApi
            const channelStore = BdApi.findModuleByProps('getChannel', 'getDMUserIds');
            const userStore = BdApi.findModuleByProps('getUser', 'getCurrentUser');
            
            if (!channelStore || !userStore) {
                this.debugLog("Could not find required Discord modules");
                return null;
            }

            // Get current user's ID to exclude it
            const currentUser = userStore.getCurrentUser();
            if (!currentUser) {
                this.debugLog("Could not get current user");
                return null;
            }

            // Get channel and its recipients
            const channel = channelStore.getChannel(channelId);
            if (!channel || !channel.recipients) {
                this.debugLog("Could not find channel or recipients");
                return null;
            }

            // Find the recipient that isn't the current user
            const recipientId = channel.recipients.find(id => id !== currentUser.id);
            if (!recipientId) {
                this.debugLog("Could not find recipient ID");
                return null;
            }

            // Get recipient user object
            const recipient = userStore.getUser(recipientId);
            if (!recipient) {
                this.debugLog("Could not get recipient user object");
                return null;
            }

            this.debugLog("Found recipient: " + recipient.username);
            return recipient;
        } catch (e) {
            this.debugLog("Error getting recipient: " + e);
            return null;
        }
    }

    saveArchive(html, channelId) {
        this.debugLog("Saving archive for channel: " + channelId);
        
        // Get DM recipient info for the filename
        const recipient = this.getDMRecipient(channelId);
        let dmName = "unknown_user";
        
        // Try to get the username from different sources
        if (recipient && recipient.username) {
            dmName = recipient.username;
        } else {
            // If we couldn't get the recipient from getDMRecipient, try to extract from the HTML
            // Look for the first message author that isn't the current user
            const match = html.match(/<div class="author">([^<]+)<span class="timestamp">/);
            if (match && match[1]) {
                dmName = match[1].trim();
                this.debugLog("Extracted username from HTML: " + dmName);
            }
        }
        
        // Sanitize the filename (remove characters that aren't allowed in filenames)
        dmName = dmName.replace(/[\\/:*?"<>|]/g, '_');
        
        // Create a date string for the filename
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
        
        // Create a blob with the HTML content
        const blob = new Blob([html], {type: 'text/html'});
        
        // Create a download link
        const a = document.createElement('a');
        a.download = `discord_dm_${dmName}_${dateStr}.html`;
        a.href = URL.createObjectURL(blob);
        a.style.display = 'none';
        
        // Add to document, click it, and remove it
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
        }, 100);
        
        BdApi.showToast(`DM archive saved as ${a.download}`, {type: "success"});
    }
}