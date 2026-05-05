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
});
