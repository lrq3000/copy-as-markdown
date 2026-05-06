import { turndownServie } from './types';

describe('turndownService', () => {
  it('preserves inline equations', () => {
    expect(turndownServie.turndown('<div>$x_1 * y_1 = z_1$</div>')).toBe('$x_1 * y_1 = z_1$');
  });

  it('preserves block equations', () => {
    expect(turndownServie.turndown('<div>\\[x^2 + y^2 = z^2\\]</div>')).toBe('\\[x^2 + y^2 = z^2\\]');
  });

  it('preserves underscores in link text', () => {
    expect(turndownServie.turndown('<a href="http://example.com">link_with_underscores</a>'))
      .toBe('[link_with_underscores](http://example.com)');
  });

  it('preserves markdown emphasis syntax in text', () => {
    expect(turndownServie.turndown('<div>This is **bold** and *italic* text.</div>'))
      .toBe('This is **bold** and *italic* text.');
  });

  it('does not keep unnecessary block-start escapes in headings', () => {
    expect(turndownServie.turndown('<h2>6. Strong formulation</h2>'))
      .toBe('## 6. Strong formulation');
    expect(turndownServie.turndown('<h3># Topic</h3>'))
      .toBe('### # Topic');
    expect(turndownServie.turndown('<h4>- not a list</h4>'))
      .toBe('#### - not a list');
    expect(turndownServie.turndown('<h5>> not a blockquote</h5>'))
      .toBe('##### > not a blockquote');
  });

  it('keeps inline-protecting escapes in headings', () => {
    expect(turndownServie.turndown('<h2>Literal *asterisks* and [brackets]</h2>'))
      .toBe('## Literal *asterisks* and \\[brackets\\]');
  });

  it('preserves complex equation syntax', () => {
    expect(turndownServie.turndown('<div>$$ \\sum_{i=1}^{n} x_i $$</div>')).toBe('$$ \\sum_{i=1}^{n} x_i $$');
  });

  it('escapes html while preserving markdown/math segments in mixed content', () => {
    expect(turndownServie.turndown('<div>Math $x < y$ and <span>more</span> text.</div>'))
      .toBe('Math $x < y$ and more text.');
  });

  it('renders table markdown', () => {
    const html = '<table><tr><th>Head 1</th><th>Head 2</th></tr><tr><td>Data 1</td><td>Data 2</td></tr></table>';
    expect(turndownServie.turndown(html)).toContain('| Head 1 | Head 2 |');
    expect(turndownServie.turndown(html)).toContain('| Data 1 | Data 2 |');
  });

  it('renders KaTeX properly', () => {
    const html = `<span class="katex-display" style=""><span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><semantics><mrow><msup><mi>a</mi><mn>2</mn></msup><mo>+</mo><msup><mi>b</mi><mn>2</mn></msup><mo>=</mo><msup><mi>c</mi><mn>2</mn></msup></mrow><annotation encoding="application/x-tex">a^2 + b^2 = c^2</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height: 0.9474em; vertical-align: -0.0833em;"></span><span class="mord"><span class="mord mathnormal">a</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height: 0.8641em;"><span style="top: -3.113em; margin-right: 0.05em;"><span class="pstrut" style="height: 2.7em;"></span><span class="sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span><span class="mspace" style="margin-right: 0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right: 0.2222em;"></span></span><span class="base"><span class="strut" style="height: 0.8641em;"></span><span class="mord"><span class="mord mathnormal">b</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height: 0.8641em;"><span style="top: -3.113em; margin-right: 0.05em;"><span class="pstrut" style="height: 2.7em;"></span><span class="sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span><span class="mspace" style="margin-right: 0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right: 0.2778em;"></span></span><span class="base"><span class="strut" style="height: 0.8641em;"></span><span class="mord"><span class="mord mathnormal">c</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height: 0.8641em;"><span style="top: -3.113em; margin-right: 0.05em;"><span class="pstrut" style="height: 2.7em;"></span><span class="sizing reset-size6 size3 mtight"><span class="mord mtight">2</span></span></span></span></span></span></span></span></span></span></span></span>`;
    expect(turndownServie.turndown(html)).toBe('$$a^2 + b^2 = c^2$$');
  });

  it('renders inline KaTeX properly', () => {
    const html = `<span class="katex"><span class="katex-mathml"><math><semantics><mrow><mi>x</mi></mrow><annotation encoding="application/x-tex">x</annotation></semantics></math></span></span>`;
    expect(turndownServie.turndown(html)).toBe('$x$');
  });

  it('renders MathJax v2 script correctly', () => {
    const htmlInline = `<script type="math/tex">x^2</script>`;
    const htmlDisplay = `<script type="math/tex; mode=display">y^2</script>`;
    expect(turndownServie.turndown(htmlInline)).toBe('$x^2$');
    expect(turndownServie.turndown(htmlDisplay)).toBe('$$y^2$$');
  });

  it('ignores MathJax preview and visual nodes', () => {
    const html = `<div><span class="MathJax_Preview">test</span><span class="MathJax"></span><mjx-container></mjx-container><script type="math/tex">z^2</script></div>`;
    expect(turndownServie.turndown(html)).toBe('$z^2$');
  });

  it('preserves line breaks in code blocks with br tags', () => {
    const htmlWithPre = `<pre><code><span>Scarcity</span><br><span>Utility</span><br><span>Decentralization</span></code></pre>`;
    const expected = '```\nScarcity\nUtility\nDecentralization\n```';
    expect(turndownServie.turndown(htmlWithPre)).toBe(expected);

    const htmlWithoutPre = `<code><span>Scarcity</span><br><span>Utility</span><br><span>Decentralization</span></code>`;
    expect(turndownServie.turndown(htmlWithoutPre)).toBe(expected);

    const htmlWithLanguage = `<pre><code class="language-javascript"><span>Scarcity</span><br><span>Utility</span></code></pre>`;
    const expectedLanguage = '```javascript\nScarcity\nUtility\n```';
    expect(turndownServie.turndown(htmlWithLanguage)).toBe(expectedLanguage);
  });

  it('preserves displayed newlines in pre-wrap text containers', () => {
    const html = `<div class="max-w-full min-w-0 [overflow-wrap:anywhere] whitespace-pre-wrap">First line

Second line</div>`;

    expect(turndownServie.turndown(html)).toBe('First line  \n  \nSecond line');
  });

  it('preserves newlines for all newline-preserving white-space values', () => {
    expect(turndownServie.turndown('<div style="white-space: pre">First line\nSecond line</div>'))
      .toBe('First line  \nSecond line');
    expect(turndownServie.turndown('<div style="white-space: pre-wrap">First line\nSecond line</div>'))
      .toBe('First line  \nSecond line');
    expect(turndownServie.turndown('<div style="white-space: pre-line">First line\nSecond line</div>'))
      .toBe('First line  \nSecond line');
    expect(turndownServie.turndown('<div style="white-space: break-spaces">First line\nSecond line</div>'))
      .toBe('First line  \nSecond line');
  });

  it('collapses newlines to spaces for white-space values that do not preserve them', () => {
    expect(turndownServie.turndown('<div style="white-space: normal">First line\nSecond line</div>'))
      .toBe('First line Second line');
    expect(turndownServie.turndown('<div style="white-space: nowrap">First line\nSecond line</div>'))
      .toBe('First line Second line');
  });

  it('honors nested white-space overrides', () => {
    const html = `<div style="white-space: pre-wrap">First line
<span style="white-space: normal">Second
line</span>
Third line</div>`;

    expect(turndownServie.turndown(html)).toBe('First line  \nSecond line  \nThird line');
  });

  it('preserves ordinary links', () => {
    expect(turndownServie.turndown('<p>Read <a href="https://example.com/docs">the docs</a>.</p>'))
      .toBe('Read [the docs](https://example.com/docs).');
  });

  it('preserves citation-style links with readable fallback text', () => {
    const html = `<p>Climate evidence <span data-state="closed"><span data-testid="webpage-citation-pill"><a href="https://science.nasa.gov/climate-change/evidence/?utm_source=chatgpt.com" alt="https://science.nasa.gov/climate-change/evidence/?utm_source=chatgpt.com"><span><span>science.nasa.gov</span><span>+2</span></span><span style="opacity: 0;"><span>ncei.noaa.gov</span><span>+2</span></span></a></span></span></p>`;

    expect(turndownServie.turndown(html))
      .toBe('Climate evidence [science.nasa.gov](https://science.nasa.gov/climate-change/evidence/?utm_source=chatgpt.com)');
  });
});
