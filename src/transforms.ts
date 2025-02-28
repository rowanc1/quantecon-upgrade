import { load as yamlLoad } from 'js-yaml';

export function blankUserExpressions(content: string) {
  const REGEX = /\n\+\+\+ {"user_expressions": \[\]}\n/g;
  const newContent = content.replace(REGEX, '');
  return newContent;
}

export function docLinksWithTitle(content: string) {
  const REGEX = /\{doc\}`([^`]*)<([^>]*)>`/g;
  const newContent = content.replace(REGEX, (match, p1, p2) => {
    return `[${p1.trim()}](${p2}.md)`;
  });
  return newContent;
}

export function docLinksBlank(content: string) {
  const REGEX = /\{doc\}`([^`]*)`/g;
  const newContent = content.replace(REGEX, (match, p1) => {
    return `[](${p1.trim()}.md)`;
  });
  return newContent;
}

/**
 * Transform code-cell blocks with inline YAML to
 * reformat or inject figure metadata as Sphinx-like directives.
 *
 * Example:
 *
 * ```{code-cell} ipython3
 * ---
 * mystnb:
 *   figure:
 *     caption: GDP per Capita (GBR)
 *     name: gdppc_gbr1
 *     width: 500px
 * tags: [hide-input]
 * ---
 * ```
 *
 * will become:
 *
 * ```{code-cell} ipython3
 * :label: gdppc_gbr1
 * :caption: GDP per Capita (GBR)
 * :width: 500px
 * :tags: [hide-input]
 * ```
 */
export function transformCodeCells(content: string): string {
  // This regex will capture three groups:
  // 1) Entire matched block (for replacement reference).
  // 2) The language (e.g. ipython3, python3, R, etc.) after `{code-cell}`.
  // 3) The YAML body between the `---` lines.
  const codeCellRegex = /```\{code-cell\}\s+([\w-]+)\n---\n([\s\S]*?)\n---\n/g;

  return content.replace(codeCellRegex, (match, lang, yamlContent) => {
    // Parse the YAML between the `---` lines
    let doc: any;
    try {
      doc = yamlLoad(yamlContent);
    } catch (err) {
      console.warn('Could not parse YAML for code-cell:', err);
      return match; // if parsing fails, just return original block
    }

    // Safely access the figure fields
    const figure = doc?.mystnb?.figure || {};
    const label = figure.name || '';
    const caption = figure.caption || '';
    const width = figure.width || '';

    // The top-level `tags` array
    // If `tags` is not an array, we fall back to an empty array
    const tagsArray = Array.isArray(doc?.tags) ? doc.tags : [];
    // Format tags as a JSON-ish array, e.g. [hide-input]
    const tags = tagsArray.join(', ');

    // Build the transformed code block
    const transformedBlock =
      [
        `\`\`\`{code-cell} ${lang}`,
        label ? `:label: ${label}` : null,
        caption ? `:caption: ${caption.trim()}` : null,
        width ? `:width: ${width}` : null,
        tags && tags.length > 0 ? `:tags: ${tags}` : null,
      ]
        .filter((l) => l != null)
        .join('\n') + '\n\n';

    return transformedBlock;
  });
}

/**
 * Transforms lines containing either ```{prf:...} or :::{prf:...}
 * by lowercasing the entire content inside the curly braces.
 */
export function transformUppercaseDirectives(content: string): string {
  // This regex looks for:
  // 1) Either ``` or :::
  // 2) Followed immediately by {
  // 3) Then captures everything up to the matching }
  //
  // Example matches:
  // ```{prf:Theorem}
  // :::{prf:Definition arg}
  //
  // The 'g' flag applies replacement to all occurrences in the text.
  const regex = /(```|:::)\{([^}]*)\}/g;

  return content.replace(regex, (match, fence, bracketText) => {
    // Lowercase whatever is inside the { }
    const lowered = bracketText.toLowerCase();
    // Rebuild the matched substring
    return `${fence}{${lowered}}`;
  });
}

export function transformContent(content: string) {
  return [
    blankUserExpressions,
    docLinksWithTitle, // Title should come before the blank version
    docLinksBlank,
    transformCodeCells,
    transformUppercaseDirectives,
  ].reduce((c, func) => func(c), content);
}
