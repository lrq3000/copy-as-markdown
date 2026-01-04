// Initialize service worker on startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Service worker started up');
});

// Use a persistent message listener instead of creating/removing listeners
let pendingRequests: Map<number, {resolve: Function, reject: Function, timeout: NodeJS.Timeout}> = new Map();

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (sender.tab?.id && request.selection !== undefined) {
    const tabId = sender.tab.id;
    const pendingRequest = pendingRequests.get(tabId);

    if (pendingRequest) {
      clearTimeout(pendingRequest.timeout);
      pendingRequests.delete(tabId);

      const markdownText = request.selection as string;

      try {
        // Execute show message script
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['js/content_script_show_message.bundle.js'],
          injectImmediately: true
        });

        // Send message to content script with markdown text
        await chrome.tabs.sendMessage(tabId, { markdownText: markdownText });

        pendingRequest.resolve();
      } catch (err) {
        console.error('Failed to inject script or send message:', err);
        pendingRequest.reject(err);
      }
    }
  }
});

// Handle action clicks
chrome.action.onClicked.addListener(async (tab) => {
  if (tab?.id) {
    try {
      // Create a promise that will resolve when the message is received
      const messagePromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          pendingRequests.delete(tab.id as number);
          reject(new Error('Message timeout'));
        }, 5000);

        pendingRequests.set(tab.id as number, { resolve, reject, timeout });
      });

      const selectionResult = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['js/content_script_get_selection.bundle.js'],
        injectImmediately: true
      });

      // Wait for the message to be processed
      await messagePromise;
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }
});


chrome.commands.onCommand.addListener(async function (command) {
  if (command === 'copy-as-markdown') {
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    const tab = tabs[0];
    if (tab?.id) {
      try {
        // Create a promise that will resolve when the message is received
        const messagePromise = new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            pendingRequests.delete(tab.id as number);
            reject(new Error('Message timeout'));
          }, 5000);

          pendingRequests.set(tab.id as number, { resolve, reject, timeout });
        });

        const selectionResult = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['js/content_script_get_selection.bundle.js'],
          injectImmediately: true
        });

        // Wait for the message to be processed
        await messagePromise;
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
  }
});


// Initialize on installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed/reloaded');
  chrome.contextMenus.create({
    id: 'copy-as-markdown-context-menu',
    title: 'Copy as Markdown',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener(async function (info, tab) {
  if (info.menuItemId === 'copy-as-markdown-context-menu') {
    if (tab?.id) {
      try {
        // Create a promise that will resolve when the message is received
        const messagePromise = new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            pendingRequests.delete(tab.id as number);
            reject(new Error('Message timeout'));
          }, 5000);

          pendingRequests.set(tab.id as number, { resolve, reject, timeout });
        });

        const selectionResult = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['js/content_script_get_selection.bundle.js'],
          injectImmediately: true
        });

        // Wait for the message to be processed
        await messagePromise;
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
  }
});
