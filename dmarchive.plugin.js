/**
 * @name DMArchive
 * @author NeroQue
 * @description Archive DMs
 * @version 0.0.1
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
        // This will be implemented later
        BdApi.showToast("Archive functionality for channel " + channelId + " coming soon!", {type: "info"});
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
}