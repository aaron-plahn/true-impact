import { TIScreen } from '../ti-screen';
import { actionToHtml } from './action-to-html';

export const tiSduiToHtmlFragment = (input: TIScreen): string => {
  const sections = Array.from(Object.values(input.sectionsById));

  const section = sections[0];

  const children: string[] = [];

  for (const node of section.nodes) {
    if (node.type === 'TEXT') {
      children.push(`<p id="${node.id}">${node.text}</p>`);

      continue;
    }

    if (node.type === 'IMAGE') {
      throw new Error(`Images are not currently supported in TI SDUI. Sorry!`);
    }

    if (node.type === 'ACTION') {
      children.push(actionToHtml(node));

      continue;
    }

    const exhaustiveCheck: never = node;

    throw new Error(
      `Unsupported type for node: ${JSON.stringify(exhaustiveCheck)}`,
    );
  }

  return `
            <div id="${section.id}">
            ${children.join('\n')}
            </div>
    `;
};
