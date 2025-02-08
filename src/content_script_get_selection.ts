import {getHtmlSelection, turndownServie} from './types'

const selectedHTML: string | undefined = getHtmlSelection();
let markdownText: string | undefined = undefined;

if (selectedHTML) {
  markdownText = turndownServie.turndown(selectedHTML);
}

console.log('Fetched selected html')
console.log(selectedHTML)
console.log('Converted to markdown')
console.log(markdownText)

chrome.runtime.sendMessage({selection: markdownText})
