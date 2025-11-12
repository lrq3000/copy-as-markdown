import {showMessage, copyToClipboard} from './types';

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.markdownText) {
      const markdownText = request.markdownText;
      showMessage();
      navigator.clipboard.writeText(markdownText).then(() => {
        console.log('Text copied to clipboard');
      }).catch(err => {
        console.error('Failed to copy text: ', err);
      });
    }
  }
);
