chrome.action.onClicked.addListener(async (tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['js/content_script_get_selection.bundle.js']
  }, function (selection) {
    if (selection && selection[0]) {
      const markdownText = selection[0];
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['js/content_script_show_message.bundle.js']
      }, function () {
        navigator.clipboard.writeText(markdownText).then(function() {
          console.log('Text copied to clipboard');
        }).catch(function(err) {
          console.error('Failed to copy text: ', err);
        });
      });
    }
  });
});


chrome.commands.onCommand.addListener(function (command) {
  if (command === 'copy-as-markdown') {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const tab = tabs[0];
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['js/content_script_get_selection.bundle.js']
      }, function (selection) {
        if (selection && selection[0]) {
          const markdownText = selection[0];
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['js/content_script_show_message.bundle.js']
          }, function () {
            navigator.clipboard.writeText(markdownText).then(function() {
              console.log('Text copied to clipboard');
            }).catch(function(err) {
              console.error('Failed to copy text: ', err);
            });
          });
        }
      });
    });
  }
});


chrome.contextMenus.create({
  id: 'copy-as-markdown-context-menu',
  title: 'Copy as Markdown',
  contexts: ['selection']
});

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  if (info.menuItemId === 'copy-as-markdown-context-menu') {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['js/content_script_get_selection.bundle.js']
    }, function (selection) {
      if (selection && selection[0]) {
        const markdownText = selection[0];
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['js/content_script_show_message.bundle.js']
        }, function () {
          navigator.clipboard.writeText(markdownText).then(function() {
              console.log('Text copied to clipboard');
          }).catch(function(err) {
              console.error('Failed to copy text: ', err);
          });
        });
      }
    });
  }
});
