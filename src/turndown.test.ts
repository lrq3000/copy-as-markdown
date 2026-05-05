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
});
