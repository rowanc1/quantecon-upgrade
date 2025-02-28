import { describe, expect, test } from 'vitest';
import { transformContent } from './transforms';

describe('Test transformations', () => {
  test.each([
    [
      'doc links',
      'As in the {doc}`present values <pv>`, {doc}`french_rev`, and {doc}`consumption smoothing<cons_smooth>` lectures, our mathematical tools are matrix multiplication and matrix inversion.',
      'As in the [present values](pv.md), [](french_rev.md), and [consumption smoothing](cons_smooth.md) lectures, our mathematical tools are matrix multiplication and matrix inversion.',
    ],
    [
      'mystnb',
      `
\`\`\`{code-cell} ipython3
---
mystnb:
  figure:
    caption: GDP per Capita (GBR)
    name: gdppc_gbr1
    width: 500px
tags: [hide-input]
---
x = 2
\`\`\`
`,

      `
\`\`\`{code-cell} ipython3
:label: gdppc_gbr1
:caption: GDP per Capita (GBR)
:width: 500px
:tags: hide-input

x = 2
\`\`\`
`,
    ],
  ])('%s', (title, source, transformed) => {
    expect(transformContent(source as any)).toBe(transformed);
  });
});
