import TurndownServie from 'turndown';
import {gfm} from 'turndown-plugin-gfm';

export const turndownServie = new TurndownServie({headingStyle: 'atx', codeBlockStyle: 'fenced'});
turndownServie.use(gfm)
const defaultEscape = turndownServie.escape.bind(turndownServie);

turndownServie.addRule('katex', {
  filter: function (node) {
    return node.nodeName === 'SPAN' && node.classList.contains('katex');
  },
  replacement: function (content, node) {
    const annotation = (node as Element).querySelector('annotation[encoding="application/x-tex"]');
    if (annotation) {
      const isDisplay = node.parentNode && (node.parentNode as Element).classList && (node.parentNode as Element).classList.contains('katex-display');
      const tex = annotation.textContent || '';
      if (isDisplay) {
        return '$$' + tex + '$$';
      } else {
        return '$' + tex + '$';
      }
    }
    return content;
  }
});

turndownServie.addRule('mathjax_script', {
  filter: function (node) {
    return node.nodeName === 'SCRIPT' && (node as HTMLScriptElement).type && (node as HTMLScriptElement).type.indexOf('math/tex') === 0;
  },
  replacement: function (content, node) {
    const isDisplay = (node as HTMLScriptElement).type.includes('mode=display');
    const tex = node.textContent || '';
    if (isDisplay) {
      return '$$' + tex + '$$';
    } else {
      return '$' + tex + '$';
    }
  }
});

turndownServie.addRule('mathjax_ignore', {
  filter: function (node) {
    return (node as Element).classList && (
      (node as Element).classList.contains('MathJax_Preview') ||
      (node as Element).classList.contains('MathJax_SVG') ||
      (node as Element).classList.contains('MathJax') ||
      (node as Element).classList.contains('MathJax_CHTML') ||
      node.nodeName === 'MJX-CONTAINER'
    );
  },
  replacement: function () {
    return '';
  }
});

const preserveRawMarkdownPattern = /(\$\$[\s\S]*?\$\$|\$[^$]+\$|\\\[[\s\S]*?\\\]|\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_)/g;

turndownServie.escape = function (string) {
  let escaped = '';
  let cursor = 0;

  for (const match of string.matchAll(preserveRawMarkdownPattern)) {
    const matchIndex = match.index ?? 0;
    const matchedText = match[0];
    escaped += defaultEscape(string.slice(cursor, matchIndex));
    escaped += matchedText;
    cursor = matchIndex + matchedText.length;
  }

  escaped += defaultEscape(string.slice(cursor));
  preserveRawMarkdownPattern.lastIndex = 0;
  return escaped;
};

export const getHtmlSelection: () => string | undefined = () => {
  const selection = window.getSelection()
  if (selection && selection.anchorNode) {
    const range = selection.getRangeAt(0);
    const div = document.createElement("div");
    div.appendChild(range.cloneContents());
    return div.innerHTML;
  } else {
    return undefined
  }
}

export const showMessage = () => {
  const div = document.createElement('div');
  div.setAttribute('style', `
  width: 200px;
  height: 50px;
  background: transparent;
  position: fixed;
  right: 10px;
  bottom: 20px;
  border-radius: 5px;
  display: flex;
    `)

  const mark = document.createElement('div');
  mark.setAttribute('style', `
  height: 100%;
  width: 5px;
  background: green;
  border-radius: 5px 0px 0px 5px;
    `)

  const message = document.createElement('div');
  message.setAttribute('style', `
  background: whitesmoke;
  height: 100%;
  flex-grow: 1;
  text-align: center;
  padding-top: 15px;
  font-size: medium;
  color: darkgray;
    `)
  message.textContent = 'Copied as Markdown'

  div.appendChild(mark)
  div.appendChild(message)
  document.body.appendChild(div)
  setTimeout(() => document.body.removeChild(div), 1500)
}

export const copyToClipboard = (content: string) => {
  const input = document.createElement('textarea');
  document.body.appendChild(input)
  input.value = content
  input.focus()
  input.select()
  document.execCommand('copy')
  input.blur()
  document.body.removeChild(input)
}
