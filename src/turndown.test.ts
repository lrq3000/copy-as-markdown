import { turndownServie } from './types';

describe('turndownService', () => {
  it('should not escape mathematical equations and syntax characters', () => {
    // Inline equation
    const html1 = '<div>$x_1 * y_1 = z_1$</div>';
    expect(turndownServie.turndown(html1)).toBe('$x_1 * y_1 = z_1$');

    // Block equation
    const html2 = '<div>\\[x^2 + y^2 = z^2\\]</div>';
    expect(turndownServie.turndown(html2)).toBe('\\[x^2 + y^2 = z^2\\]');

    // Link with underscores
    const html3 = '<a href="http://example.com">link_with_underscores</a>';
    expect(turndownServie.turndown(html3)).toBe('[link_with_underscores](http://example.com)');

    // Bold syntax inside text
    const html4 = '<div>This is **bold** and *italic* text.</div>';
    expect(turndownServie.turndown(html4)).toBe('This is **bold** and *italic* text.');

    // Complex mathematical equation
    const html5 = '<div>$$ \\sum_{i=1}^{n} x_i $$</div>';
    expect(turndownServie.turndown(html5)).toBe('$$ \\sum_{i=1}^{n} x_i $$');

    // Markdown table check
    const html6 = '<table><tr><th>Head 1</th><th>Head 2</th></tr><tr><td>Data 1</td><td>Data 2</td></tr></table>';
    expect(turndownServie.turndown(html6)).toContain('| Head 1 | Head 2 |');
    expect(turndownServie.turndown(html6)).toContain('| Data 1 | Data 2 |');
  });
});
