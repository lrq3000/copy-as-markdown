chrome.action.onClicked.addListener(async (tab) => {
  console.log('[DEBUG] Action clicked, tab ID:', tab?.id);
  if (tab?.id) {
    try {
      // Create message listener BEFORE executing the content script
      const messageListener = function(request: any, sender: any, sendResponse: any) {
        console.log('[DEBUG] Received message:', request, 'from sender:', sender);
        if (sender.tab?.id === tab.id && request.selection !== undefined) {
          console.log('[DEBUG] Message matches tab ID, processing selection');
          chrome.runtime.onMessage.removeListener(messageListener); // Remove listener after handling message
          const markdownText = request.selection as string;

          console.log('Received markdown text:', markdownText);

          console.log('[DEBUG] Executing content_script_show_message.bundle.js');
          chrome.scripting.executeScript({
            target: { tabId: tab.id as number },
            files: ['js/content_script_show_message.bundle.js'],
            injectImmediately: true
          });
          // Send message to content script with markdown text
          console.log('[DEBUG] Sending markdownText to content script');
          chrome.tabs.sendMessage(tab.id as number, { markdownText: markdownText });
        } else {
          console.log('[DEBUG] Message does not match tab ID or no selection');
        }
      };

      chrome.runtime.onMessage.addListener(messageListener);

      // Set a timeout to remove the listener if no message is received within 5 seconds
      setTimeout(() => {
        chrome.runtime.onMessage.removeListener(messageListener);
        console.log('[DEBUG] Listener timeout - removed after 5 seconds');
      }, 5000);

      console.log('[DEBUG] Executing content_script_get_selection.bundle.js');
      const selectionResult = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['js/content_script_get_selection.bundle.js'],
        injectImmediately: true
      });
      console.log('[DEBUG] Script execution result:', selectionResult);

      console.log('Text copied to clipboard');
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  } else {
    console.log('[DEBUG] No tab ID available');
  }
});


chrome.commands.onCommand.addListener(async function (command) {
  console.log('[DEBUG] Command triggered:', command);
  if (command === 'copy-as-markdown') {
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    const tab = tabs[0];
    console.log('[DEBUG] Active tab:', tab?.id);
    if (tab?.id) {
      try {
        // Create message listener BEFORE executing the content script
        const messageListener = function(request: any, sender: any, sendResponse: any) {
          console.log('[DEBUG] Received message for command:', request, 'from sender:', sender);
          if (sender.tab?.id === tab.id && request.selection !== undefined) {
            console.log('[DEBUG] Message matches tab ID for command, processing selection');
            chrome.runtime.onMessage.removeListener(messageListener); // Remove listener after handling message
            const markdownText = request.selection as string;

            console.log('Received markdown text:', markdownText);

            console.log('[DEBUG] Executing content_script_show_message.bundle.js for command');
            chrome.scripting.executeScript({
              target: { tabId: tab.id as number }, // Assert tab.id is number
              files: ['js/content_script_show_message.bundle.js'],
              injectImmediately: true
            });
            // Send message to content script with markdown text
            console.log('[DEBUG] Sending markdownText to content script for command');
            chrome.tabs.sendMessage(tab.id as number, { markdownText: markdownText }); // Assert tab.id is number
          } else {
            console.log('[DEBUG] Message does not match tab ID or no selection for command');
          }
        };

        chrome.runtime.onMessage.addListener(messageListener);

        // Set a timeout to remove the listener if no message is received within 5 seconds
        setTimeout(() => {
          chrome.runtime.onMessage.removeListener(messageListener);
          console.log('[DEBUG] Listener timeout for command - removed after 5 seconds');
        }, 5000);

        console.log('[DEBUG] Executing content_script_get_selection.bundle.js for command');
        const selectionResult = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['js/content_script_get_selection.bundle.js'],
          injectImmediately: true
        });
        console.log('[DEBUG] Script execution result for command:', selectionResult);

        console.log('Text copied to clipboard');
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    } else {
      console.log('[DEBUG] No tab ID available for command');
    }
  }
});


chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'copy-as-markdown-context-menu',
    title: 'Copy as Markdown',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener(async function (info, tab) {
  console.log('[DEBUG] Context menu clicked:', info.menuItemId, 'tab:', tab?.id);
  if (info.menuItemId === 'copy-as-markdown-context-menu') {
    if (tab?.id) {
      try {
        // Create message listener BEFORE executing the content script
        const messageListener = function(request: any, sender: any, sendResponse: any) {
          console.log('[DEBUG] Received message for context menu:', request, 'from sender:', sender);
          if (sender.tab?.id === tab.id && request.selection !== undefined) {
            console.log('[DEBUG] Message matches tab ID for context menu, processing selection');
            chrome.runtime.onMessage.removeListener(messageListener); // Remove listener after handling message
            const markdownText = request.selection as string;

            console.log('Received markdown text:', markdownText);

            console.log('[DEBUG] Executing content_script_show_message.bundle.js for context menu');
            chrome.scripting.executeScript({
              target: { tabId: tab.id as number }, // Assert tab.id is number
              files: ['js/content_script_show_message.bundle.js'],
              injectImmediately: true
            });
            // Send message to content script with markdown text
            console.log('[DEBUG] Sending markdownText to content script for context menu');
            chrome.tabs.sendMessage(tab.id as number, { markdownText: markdownText }); // Assert tab.id is number
          } else {
            console.log('[DEBUG] Message does not match tab ID or no selection for context menu');
          }
        };

        chrome.runtime.onMessage.addListener(messageListener);

        // Set a timeout to remove the listener if no message is received within 5 seconds
        setTimeout(() => {
          chrome.runtime.onMessage.removeListener(messageListener);
          console.log('[DEBUG] Listener timeout for context menu - removed after 5 seconds');
        }, 5000);

        console.log('[DEBUG] Executing content_script_get_selection.bundle.js for context menu');
        const selectionResult = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['js/content_script_get_selection.bundle.js'],
          injectImmediately: true
        });
        console.log('[DEBUG] Script execution result for context menu:', selectionResult);

        console.log('Text copied to clipboard');
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    } else {
      console.log('[DEBUG] No tab ID available for context menu');
    }
  }
});
