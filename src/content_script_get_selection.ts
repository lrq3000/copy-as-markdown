import {getHtmlSelection, turndownServie} from './types'

console.log('[DEBUG] Content script get_selection started');

const selectedHTML: string | undefined = getHtmlSelection();
let markdownText: string | undefined = undefined;

console.log('[DEBUG] Fetched selected HTML:', selectedHTML);

if (selectedHTML) {
  markdownText = turndownServie.turndown(selectedHTML);
  console.log('[DEBUG] Converted to markdown:', markdownText);
} else {
  console.log('[DEBUG] No HTML selection found');
}

console.log('[DEBUG] Sending message with selection:', {selection: markdownText});
chrome.runtime.sendMessage({selection: markdownText})
