chrome.action.onClicked.addListener(async (tab) => {
  if (tab?.id) {
    try {
      const selectionResult = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['js/content_script_get_selection.bundle.js']
      });
      if (selectionResult && selectionResult[0]?.result) {
        const markdownText = selectionResult[0].result as string;
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['js/content_script_show_message.bundle.js']
        });
        await navigator.clipboard.writeText(markdownText);
        console.log('Text copied to clipboard');
      }
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
          files: ['js/content_script_get_selection.bundle.js']
        });
        if (selectionResult && selectionResult[0]?.result) {
          const markdownText = selectionResult[0].result as string;
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['js/content_script_show_message.bundle.js']
          });
          await navigator.clipboard.writeText(markdownText);
          console.log('Text copied to clipboard');
        }
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
  }
});


chrome.contextMenus.create({
  id: 'copy-as-markdown-context-menu',
  title: 'Copy as Markdown',
  contexts: ['selection']
});

chrome.contextMenus.onClicked.addListener(async function (info, tab) {
  if (info.menuItemId === 'copy-as-markdown-context-menu') {
    if (tab?.id) {
      try {
        const selectionResult = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['js/content_script_get_selection.bundle.js']
        });
        if (selectionResult && selectionResult[0]?.result) {
          const markdownText = selectionResult[0].result as string;
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['js/content_script_show_message.bundle.js']
          });
          await navigator.clipboard.writeText(markdownText);
          console.log('Text copied to clipboard');
        }
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
  }
});
