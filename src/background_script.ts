chrome.action.onClicked.addListener(async (tab) => {
  if (tab?.id) {
    try {
      const selectionResult = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['js/content_script_get_selection.bundle.js'],
        injectImmediately: true
      });

      chrome.runtime.onMessage.addListener(function messageListener(request, sender, sendResponse) {
        if (sender.tab?.id === tab.id && request.selection !== undefined) {
          chrome.runtime.onMessage.removeListener(messageListener); // Remove listener after handling message
          const markdownText = request.selection as string;

          console.log('Received markdown text:', markdownText);

          chrome.scripting.executeScript({
            target: { tabId: tab.id as number },
            files: ['js/content_script_show_message.bundle.js'],
            injectImmediately: true
          });
          // Send message to content script with markdown text
          chrome.tabs.sendMessage(tab.id as number, { markdownText: markdownText });
        }
      });


      console.log('Text copied to clipboard');
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
        const selectionResult = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['js/content_script_get_selection.bundle.js'],
          injectImmediately: true
        });

        chrome.runtime.onMessage.addListener(function messageListener(request, sender, sendResponse) {
          if (sender.tab?.id === tab.id && request.selection !== undefined) {
            chrome.runtime.onMessage.removeListener(messageListener); // Remove listener after handling message
            const markdownText = request.selection as string;

            console.log('Received markdown text:', markdownText);

            chrome.scripting.executeScript({
              target: { tabId: tab.id as number }, // Assert tab.id is number
              files: ['js/content_script_show_message.bundle.js'],
              injectImmediately: true
            });
            // Send message to content script with markdown text
            chrome.tabs.sendMessage(tab.id as number, { markdownText: markdownText }); // Assert tab.id is number
          }
        });
        console.log('Text copied to clipboard');
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
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
  if (info.menuItemId === 'copy-as-markdown-context-menu') {
    if (tab?.id) {
      try {
        const selectionResult = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['js/content_script_get_selection.bundle.js'],
          injectImmediately: true
        });

        chrome.runtime.onMessage.addListener(function messageListener(request, sender, sendResponse) {
          if (sender.tab?.id === tab.id && request.selection !== undefined) {
            chrome.runtime.onMessage.removeListener(messageListener); // Remove listener after handling message
            const markdownText = request.selection as string;

            console.log('Received markdown text:', markdownText);

            chrome.scripting.executeScript({
              target: { tabId: tab.id as number }, // Assert tab.id is number
              files: ['js/content_script_show_message.bundle.js'],
              injectImmediately: true
            });
            // Send message to content script with markdown text
            chrome.tabs.sendMessage(tab.id as number, { markdownText: markdownText }); // Assert tab.id is number
          }
        });
        console.log('Text copied to clipboard');
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
  }
});
