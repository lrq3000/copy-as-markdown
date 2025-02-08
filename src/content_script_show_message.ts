import {showMessage, copyToClipboard} from './types';

// content_script_show_message.ts

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.markdownText) {
      const markdownText = request.markdownText;
      showMessage();
      // Use navigator.clipboard.writeText directly in content script
      navigator.clipboard.writeText(markdownText).then(() => {
        console.log('Text copied to clipboard (using navigator.clipboard.writeText)');
      }).catch(err => {
        console.error('Failed to copy text (using navigator.clipboard.writeText): ', err);
      });
      // copyToClipboard(markdownText); // Removed call to copyToClipboard function
    }
  }
);
