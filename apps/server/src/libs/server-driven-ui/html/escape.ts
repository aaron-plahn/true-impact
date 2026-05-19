/**
 * See the [htmx security docs](https://htmx.org/essays/web-security-basics-with-htmx/). Note that you will
 * see the same replacements in any templating library, e.g. "nunjucks" or "ejs".
 */
const dangerousHtmlCharToReplacement = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&grave;',
  '=': '&#x3D;',
} as const;

const patternForDangerousHtmlCharacters = /[&<>"'`=/]/g;

const getReplacementChar = (
  char: keyof typeof dangerousHtmlCharToReplacement,
) => dangerousHtmlCharToReplacement[char];

// Should this take in any old value?
export const escape = (text: string) => {
  return new String(text).replace(
    patternForDangerousHtmlCharacters,
    getReplacementChar,
  );
};
