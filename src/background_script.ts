// Initialize service worker on startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Service worker started up');
});

// Initial timeout duration in milliseconds (5 seconds)
const INITIAL_TIMEOUT_MS = 5000;

// Monotonic counter to uniquely identify each pending request for a given tab.
// This prevents a stale timeout/cleanup from deleting a newer request's map entry.
let nextRequestId = 0;

interface PendingRequest {
  resolve: Function;
  reject: Function;
  timeout?: NodeJS.Timeout;
  /** Uniquely identifies this request among all requests for the same tab. */
  requestId: number;
}

// Use a persistent message listener instead of creating/removing listeners
let pendingRequests: Map<number, PendingRequest> = new Map();

/**
 * Clean up a completed pending request by clearing its timer and removing it
 * from the map, but ONLY if the map entry still belongs to this requestId.
 * This guards against a stale cleanup call overwriting a newer request for the
 * same tab.
 */
function cleanupPendingRequest(tabId: number, requestId: number) {
  const pendingRequest = pendingRequests.get(tabId);
  if (!pendingRequest || pendingRequest.requestId !== requestId) {
    return; // Either no entry or a newer request has overwritten this one
  }
  if (pendingRequest.timeout) {
    clearTimeout(pendingRequest.timeout);
  }
  pendingRequests.delete(tabId);
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (sender.tab?.id && request.selection !== undefined) {
    const tabId = sender.tab.id;
    const pendingRequest = pendingRequests.get(tabId);

    if (pendingRequest) {
      const requestId = pendingRequest.requestId;
      cleanupPendingRequest(tabId, requestId);

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

// Ask the user whether to continue waiting when the timeout fires.
// Injects a confirm() dialog into the target page so the user can decide.
async function askUserToKeepWaiting(tabId: number): Promise<boolean> {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => window.confirm(
        'Converting selected text to Markdown is taking longer than expected.\n\nDo you want to continue waiting?'
      ),
      injectImmediately: true
    });
    return results[0]?.result === true;
  } catch {
    // If script injection fails (e.g. tab closed), treat as user cancellation
    return false;
  }
}

// Wait for the selection message with an interactive timeout that doubles each round.
// When the timer expires, the user is prompted to continue or cancel.
// If they continue, the timeout doubles and a new timer starts.
// This repeats until either the message arrives or the user cancels.
// Rejects immediately if a previous request for the same tab is still pending,
// to avoid the newer request's map entry being silently deleted by the older
// request's cleanup.
function waitForSelectionMessage(tabId: number): Promise<void> {
  // Guard: reject concurrent requests for the same tab so that a stale
  // cleanup from an older request cannot erase a newer request's map entry.
  const existing = pendingRequests.get(tabId);
  if (existing) {
    return Promise.reject(
      new Error('A copy request is already pending for this tab. Please wait for it to complete or cancel.')
    );
  }

  // Acquire a unique ID for this request before any async gap
  const requestId = nextRequestId++;

  return new Promise<void>((resolve, reject) => {
    let timeoutDuration = INITIAL_TIMEOUT_MS;
    let timeoutId: NodeJS.Timeout | undefined;
    let isResolved = false; // Guard against double resolve/reject after user interaction

    // Clean up timers and remove from pending map, but ONLY if the map entry
    // still belongs to this requestId (prevents stale cleanup from clobbering
    // a newer request).
    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
      cleanupPendingRequest(tabId, requestId);
    };

    // Called when the timeout fires: prompt user, then either continue or reject
    const handleTimeout = async () => {
      if (isResolved) return; // Message arrived while confirm was showing
      try {
        const continueWaiting = await askUserToKeepWaiting(tabId);
        if (!isResolved) {
          if (continueWaiting) {
            timeoutDuration *= 2; // Double the timeout for the next round
            console.log(`User chose to continue waiting. New timeout: ${timeoutDuration}ms`);
            timeoutId = setTimeout(handleTimeout, timeoutDuration);
          } else {
            console.log('User cancelled the copy operation');
            cleanup();
            reject(new Error('User cancelled the copy operation'));
          }
        }
      } catch {
        if (!isResolved) {
          cleanup();
          reject(new Error('Message timeout'));
        }
      }
    };

    // Store the pending request so the global message listener can resolve it
    pendingRequests.set(tabId, {
      resolve: () => {
        isResolved = true;
        cleanup();
        resolve();
      },
      reject: (err: Error) => {
        isResolved = true;
        cleanup();
        reject(err);
      },
      timeout: undefined, // Timeout is managed by the closure, not the map entry
      requestId
    });

    // Set the initial timeout
    timeoutId = setTimeout(handleTimeout, timeoutDuration);
  });
}

// Handle action clicks (toolbar button)
chrome.action.onClicked.addListener(async (tab) => {
  if (tab?.id) {
    try {
      // Inject the selection script which will convert HTML to Markdown
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['js/content_script_get_selection.bundle.js'],
        injectImmediately: true
      });

      // Wait with interactive timeout for the content script to send back the result
      await waitForSelectionMessage(tab.id);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener(async function (command) {
  if (command === 'copy-as-markdown') {
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    const tab = tabs[0];
    if (tab?.id) {
      try {
        // Inject the selection script which will convert HTML to Markdown
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['js/content_script_get_selection.bundle.js'],
          injectImmediately: true
        });

        // Wait with interactive timeout for the content script to send back the result
        await waitForSelectionMessage(tab.id);
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

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async function (info, tab) {
  if (info.menuItemId === 'copy-as-markdown-context-menu') {
    if (tab?.id) {
      try {
        // Inject the selection script which will convert HTML to Markdown
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['js/content_script_get_selection.bundle.js'],
          injectImmediately: true
        });

        // Wait with interactive timeout for the content script to send back the result
        await waitForSelectionMessage(tab.id);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
  }
});
