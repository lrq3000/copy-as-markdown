import {showMessage, copyToClipboard} from './types';

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.markdownText) {
      const markdownText = request.markdownText;
      showMessage();

      // Function to try fallback method
      const useFallback = () => {
        try {
          copyToClipboard(markdownText);
          console.log('Text copied to clipboard using fallback');
        } catch (err) {
          console.error('Failed to copy text using fallback: ', err);
        }
      };

      // Try using the Clipboard API if available (only works in secure contexts)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(markdownText).then(() => {
          console.log('Text copied to clipboard');
        }).catch(err => {
          console.error('Failed to copy text using Clipboard API: ', err);
          useFallback();
        });
      } else {
        // Fallback for insecure contexts (HTTP) or browsers without Clipboard API
        console.log('Clipboard API unavailable, using fallback');
        useFallback();
      }
    }
  }
);
