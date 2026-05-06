import TurndownServie from 'turndown';
import {gfm} from 'turndown-plugin-gfm';

export const turndownServie = new TurndownServie({headingStyle: 'atx', codeBlockStyle: 'fenced'});
turndownServie.use(gfm)
const defaultEscape = turndownServie.escape.bind(turndownServie);

const blockStartEscapesInHeading = [
  [/^\\(#{1,6} )/, '$1'],
  [/^\\(-)/, '$1'],
  [/^\\(\+ )/, '$1'],
  [/^\\(>)/, '$1'],
  [/^\\(=+)/, '$1'],
  [/^\\(~~~)/, '$1'],
  [/^(\d+)\\\. /, '$1. ']
];

const hasClass = (node: Element, className: string): boolean => {
  return node.classList && node.classList.contains(className);
};

type WhiteSpaceNewlineMode = 'preserve' | 'collapse';

const whiteSpaceClassNewlineModes: {[className: string]: WhiteSpaceNewlineMode} = {
  'whitespace-break-spaces': 'preserve',
  'whitespace-normal': 'collapse',
  'whitespace-nowrap': 'collapse',
  'whitespace-pre': 'preserve',
  'whitespace-pre-line': 'preserve',
  'whitespace-pre-wrap': 'preserve'
};

const whiteSpaceValueNewlineModes: {[value: string]: WhiteSpaceNewlineMode} = {
  'break-spaces': 'preserve',
  'collapse': 'collapse',
  'normal': 'collapse',
  'nowrap': 'collapse',
  'pre': 'preserve',
  'pre-line': 'preserve',
  'pre-wrap': 'preserve',
  'preserve-breaks': 'preserve',
  'preserve-spaces': 'collapse',
  'wrap': 'collapse'
};

const textareaRawValueAttribute = 'data-copy-as-markdown-raw-value';

const getWhiteSpaceStyleValue = (node: Element): string | undefined => {
  const style = node.getAttribute('style') || '';
  const match = style.match(/(?:^|;)\s*white-space\s*:\s*([^;]+)/i);

  return match ? match[1].trim().toLowerCase().replace(/\s+/g, ' ') : undefined;
};

const getWhiteSpaceModeFromValue = (value: string | undefined): WhiteSpaceNewlineMode | undefined => {
  if (!value) return undefined;
  if (whiteSpaceValueNewlineModes[value]) return whiteSpaceValueNewlineModes[value];

  // CSS Text Level 4 allows two-keyword shorthands such as
  // `white-space: preserve nowrap`. Any `preserve` shorthand except
  // `preserve-spaces` keeps authored segment breaks as displayed line breaks.
  if (/\bpreserve\b/.test(value) && !/\bpreserve-spaces\b/.test(value)) return 'preserve';
  if (/\b(collapse|normal|nowrap)\b/.test(value)) return 'collapse';

  return undefined;
};

const getWhiteSpaceModeFromClass = (node: Element): WhiteSpaceNewlineMode | undefined => {
  for (const className of Object.keys(whiteSpaceClassNewlineModes)) {
    if (hasClass(node, className)) return whiteSpaceClassNewlineModes[className];
  }

  return undefined;
};

const getDeclaredWhiteSpaceMode = (node: Element): WhiteSpaceNewlineMode | undefined => {
  const declaredMode = getWhiteSpaceModeFromValue(getWhiteSpaceStyleValue(node)) || getWhiteSpaceModeFromClass(node);
  if (declaredMode) return declaredMode;

  // Browsers give these elements preformatted default whitespace semantics even
  // without an authored CSS declaration. Preserve their segment breaks unless a
  // copied inline style or utility class explicitly overrides that behavior.
  if (node.nodeName === 'PRE' || node.nodeName === 'TEXTAREA') return 'preserve';

  return undefined;
};

const hasExplicitWhiteSpaceHandling = (html: string): boolean => {
  return /white-space\s*:|whitespace-(normal|nowrap|pre|pre-wrap|pre-line|break-spaces)|<(pre|textarea)(\s|>)/i.test(html);
};

const encodeAttributeValue = (value: string): string => {
  return encodeURIComponent(value);
};

const decodeAttributeValue = (value: string | null): string | undefined => {
  if (!value) return undefined;

  try {
    return decodeURIComponent(value);
  } catch (e) {
    return undefined;
  }
};

const unescapeHeadingContent = (content: string): string => {
  // Turndown escapes block-start Markdown markers before the heading rule runs.
  // Once the text is inside an ATX heading, those escapes no longer prevent a
  // list, blockquote, thematic break, or competing heading from starting, while
  // inline-protecting escapes such as \*, \[, \], \_, and \` still matter.
  return blockStartEscapesInHeading.reduce((heading, escape) => heading.replace(escape[0], escape[1]), content);
};

const escapeLinkDestination = (destination: string): string => {
  const safeDestination = destination.replace(/[\r\n]+/g, ' ').trim();

  if (safeDestination.indexOf(' ') >= 0) {
    return '<' + safeDestination.replace(/([\\<>])/g, '\\$1') + '>';
  }

  return safeDestination.replace(/([\\<>()])/g, '\\$1');
};

const cleanAttribute = (attribute: string | null): string => {
  return attribute ? attribute.replace(/(\n+\s*)+/g, '\n') : '';
};

const escapeLinkTitle = (title: string): string => {
  return title.replace(/"/g, '\\"');
};

const getHostname = (href: string): string => {
  try {
    return new URL(href).hostname || href;
  } catch (e) {
    return href;
  }
};

const hasCitationMarker = (node: Element): boolean => {
  let current: Element | null = node;

  while (current) {
    if (hasClass(current, 'citation') || current.hasAttribute('data-citation') || current.getAttribute('data-testid') === 'webpage-citation-pill') {
      return true;
    }

    current = current.parentElement;
  }

  return false;
};

const getReadableLinkText = (content: string, node: HTMLAnchorElement): string => {
  const text = content.replace(/\s+/g, ' ').trim();
  const hrefHostname = getHostname(node.getAttribute('href') || '');

  // Citation pills often render the source hostname, counters such as "+2",
  // and hidden animated alternative labels inside the same anchor. Collapse to
  // the hostname only when those UI-specific signals are present, so ordinary
  // links that mention their host keep their full authored label.
  const looksLikeCitationPill = !!text && !!hrefHostname && text.indexOf(hrefHostname) >= 0 && (
    /\+\d+/.test(text) ||
    hasCitationMarker(node) ||
    !!node.querySelector('[style*="opacity: 0"], [aria-hidden="true"]')
  );
  if (looksLikeCitationPill) return hrefHostname;
  if (text && !/^\+\d+$/.test(text)) return text;

  const alt = (node.getAttribute('alt') || '').trim();
  if (alt) return getHostname(alt);

  return hrefHostname;
};

const readableLinkRule = {
  references: [] as string[],

  filter: function (node: Node) {
    return node.nodeName === 'A' && !!(node as HTMLAnchorElement).getAttribute('href');
  },

  replacement: function (content: string, node: Node, options: TurndownServie.Options) {
    const anchor = node as HTMLAnchorElement;
    const href = escapeLinkDestination(anchor.getAttribute('href') || '');
    const text = getReadableLinkText(content, anchor);
    const rawTitle = cleanAttribute(anchor.getAttribute('title'));
    const title = rawTitle ? ' "' + escapeLinkTitle(rawTitle) + '"' : '';

    if (options.linkStyle === 'referenced') {
      let replacement = '';
      let reference = '';

      switch (options.linkReferenceStyle) {
        case 'collapsed':
          replacement = '[' + text + '][]';
          reference = '[' + text + ']: ' + href + title;
          break;
        case 'shortcut':
          replacement = '[' + text + ']';
          reference = '[' + text + ']: ' + href + title;
          break;
        default:
          const id = readableLinkRule.references.length + 1;
          replacement = '[' + text + '][' + id + ']';
          reference = '[' + id + ']: ' + href + title;
      }

      readableLinkRule.references.push(reference);
      return replacement;
    }

    return '[' + text + '](' + href + title + ')';
  },

  append: function () {
    if (!readableLinkRule.references.length) return '';

    const references = '\n\n' + readableLinkRule.references.join('\n') + '\n\n';
    readableLinkRule.references = [];
    return references;
  }
};

const replaceTextNewlines = (node: Node, mode: WhiteSpaceNewlineMode): void => {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === 3 && child.textContent && /\r|\n/.test(child.textContent)) {
      if (mode === 'collapse') {
        child.textContent = child.textContent.replace(/[\r\n]+/g, ' ');
        continue;
      }

      const parts = child.textContent.split(/(\r\n|\r|\n)/);

      for (const part of parts) {
        if (!part) continue;

        if (/^(\r\n|\r|\n)$/.test(part)) {
          node.insertBefore(child.ownerDocument.createElement('br'), child);
        } else {
          node.insertBefore(child.ownerDocument.createTextNode(part), child);
        }
      }

      node.removeChild(child);
      continue;
    }
  }
};

const normalizeWhiteSpaceTextNodes = (node: Node, inheritedMode: WhiteSpaceNewlineMode): void => {
  const mode = node.nodeType === 1 ? getDeclaredWhiteSpaceMode(node as Element) || inheritedMode : inheritedMode;

  if (node.nodeName === 'TEXTAREA') {
    (node as Element).setAttribute(textareaRawValueAttribute, encodeAttributeValue((node as HTMLTextAreaElement).value || node.textContent || ''));
    return;
  }

  replaceTextNewlines(node, mode);

  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === 1) {
      normalizeWhiteSpaceTextNodes(child, mode);
    }
  }
};

const createPreprocessRoot = (html: string): Element | null => {
  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString('<x-turndown-root>' + html + '</x-turndown-root>', 'text/html');
    return doc.querySelector('x-turndown-root');
  }

  const domino = require('@mixmark-io/domino');
  const doc = domino.createDocument('<x-turndown-root>' + html + '</x-turndown-root>');
  return doc.querySelector('x-turndown-root');
};

const preprocessTurndownInput = (input: string | Node): string | Node => {
  if (typeof input === 'string') {
    if (!/(\r|\n)/.test(input) || !hasExplicitWhiteSpaceHandling(input)) return input;

    const root = createPreprocessRoot(input);
    if (!root) return input;

    normalizeWhiteSpaceTextNodes(root, 'collapse');
    return root.innerHTML;
  }

  const root = input.cloneNode(true) as Node;
  if ('querySelectorAll' in root) {
    normalizeWhiteSpaceTextNodes(root, 'collapse');
  }
  return root;
};

const defaultTurndown = turndownServie.turndown.bind(turndownServie);

turndownServie.turndown = function (input: string | Node): string {
  return defaultTurndown(preprocessTurndownInput(input));
};

turndownServie.addRule('heading-with-clean-block-start-escapes', {
  filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  replacement: function (content, node, options) {
    const hLevel = Number(node.nodeName.charAt(1));
    const cleanedContent = unescapeHeadingContent(content);

    if (options.headingStyle === 'setext' && hLevel < 3) {
      const underline = Array(cleanedContent.length + 1).join(hLevel === 1 ? '=' : '-');
      return '\n\n' + cleanedContent + '\n' + underline + '\n\n';
    }

    return '\n\n' + Array(hLevel + 1).join('#') + ' ' + cleanedContent + '\n\n';
  }
});

turndownServie.addRule('links-with-readable-fallback-text', readableLinkRule);

turndownServie.addRule('textarea-with-default-preformatted-whitespace', {
  filter: 'textarea',
  replacement: function (content, node) {
    const text = decodeAttributeValue((node as Element).getAttribute(textareaRawValueAttribute)) || (node as HTMLTextAreaElement).value || content;
    return '\n\n' + text.replace(/\r\n|\r|\n/g, '  \n') + '\n\n';
  }
});

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

turndownServie.addRule('pre-code-with-br', {
  filter: function (node) {
    if (node.nodeName === 'PRE') {
      const codeEl = (node as Element).querySelector('code');
      if (codeEl && codeEl.querySelector('br') !== null) {
        return true;
      }
    }
    if (node.nodeName === 'CODE' && node.parentNode && node.parentNode.nodeName !== 'PRE' && (node as Element).querySelector('br') !== null) {
      return true;
    }
    return false;
  },
  replacement: function (content, node) {
    const extractText = (n: Node): string => {
        if (n.nodeName === 'BR') return '\n';
        if (n.nodeType === 3) return n.textContent || '';

        let text = '';
        for (let child of Array.from(n.childNodes)) {
            text += extractText(child);
        }
        return text;
    };

    let textContent = '';
    let codeNode: Element | null = null;

    if (node.nodeName === 'PRE') {
       codeNode = (node as Element).querySelector('code');
       if (codeNode) {
          textContent = extractText(codeNode);
       } else {
          textContent = extractText(node);
       }
    } else {
       codeNode = node as Element;
       textContent = extractText(node);
    }

    let language = '';
    if (codeNode && codeNode.className) {
      const match = codeNode.className.match(/language-(\S+)/);
      if (match) {
        language = match[1];
      }
    }

    return '\n```' + language + '\n' + textContent.trimEnd() + '\n```\n';
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
