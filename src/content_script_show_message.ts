import {showMessage, copyToClipboard} from './types';

// content_script_show_message.ts

console.log('[DEBUG] Content script show_message loaded');

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log('[DEBUG] Received message in show_message:', request);
    if (request.markdownText) {
      const markdownText = request.markdownText;
      console.log('[DEBUG] Showing message and copying text:', markdownText);
      showMessage();
      // Use navigator.clipboard.writeText directly in content script
      navigator.clipboard.writeText(markdownText).then(() => {
        console.log('Text copied to clipboard (using navigator.clipboard.writeText)');
      }).catch(err => {
        console.error('Failed to copy text (using navigator.clipboard.writeText): ', err);
      });
      // copyToClipboard(markdownText); // Removed call to copyToClipboard function
    } else {
      console.log('[DEBUG] No markdownText in request');
    }
  }
);
