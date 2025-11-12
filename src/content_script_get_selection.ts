import {getHtmlSelection, turndownServie} from './types'

const selectedHTML: string | undefined = getHtmlSelection();
let markdownText: string | undefined = undefined;

if (selectedHTML) {
  markdownText = turndownServie.turndown(selectedHTML);
}

chrome.runtime.sendMessage({selection: markdownText})
