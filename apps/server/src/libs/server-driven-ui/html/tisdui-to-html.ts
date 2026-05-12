import { TIScreen } from '../ti-screen';

export const tiSduiToHtml = (input: TIScreen): string => {
  const sections = Array.from(Object.values(input.sectionsById));

  const section = sections[0];

  const text = section.nodes.reduce((acc, node) => {
    if (node.type === 'TEXT') {
      acc += `\n${node.text}`;
    }

    return acc;
  }, '');

  return `
    <!Doctype html>
    <html>
        <head>
            <meta charset="utf-8" />
            <title>${input.title}</title>
        </head>
        <body>
            ${text}
        </body>
    </html>
    `;
};
