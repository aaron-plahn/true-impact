import {
  TrueImpactError,
  TrueImpactRuntimeException,
} from 'src/libs/data-types';
import { TIScreen } from '../ti-screen';
import { TiSduiLayout } from '../tisdui-layout';
import { actionToHtmlFragment } from './action-to-html-fragment';
import { escape } from './escape';

export const tiSduiToHtmlFragment = (
  input: TIScreen,
  size: 's' | 'l' = 's',
): string => {
  const sections = Array.from(Object.values(input.sectionsById));

  const sectionsById = new Map<string, string>();

  for (const section of sections) {
    const children: string[] = [];

    for (const node of section.nodes) {
      if (node.type === 'TEXT') {
        // TODO write a test that proves that this escape is working
        children.push(`<p id="${node.id}">${escape(node.text)}</p>`);

        continue;
      }

      if (node.type === 'IMAGE') {
        throw new Error(
          `Images are not currently supported in TI SDUI. Sorry!`,
        );
      }

      if (node.type === 'ACTION') {
        children.push(actionToHtmlFragment(node));

        continue;
      }

      const exhaustiveCheck: never = node;

      throw new Error(
        `Unsupported type for node: ${JSON.stringify(exhaustiveCheck)}`,
      );
    }

    const html = `
            <div id="${section.id}">
            ${children.join('\n')}
            </div>
    `;

    sectionsById.set(section.id, html);
  }

  // So far, we only handle the small layout
  /**
   * TODO support one layout per screen size.
   */

  const layout = input.layoutsBySize[size];

  if (layout.type === 'stack') {
    let result = '';

    if (layout.items.length === 0) {
      return `<div>Encountered a stack layout [${size}] with no items.</div>`;
    }

    for (const sectionId of layout.items) {
      if (!sectionsById.has(sectionId)) {
        console.log({ sectionId, sectionsById });

        return `<div>Missing section ID: ${sectionId}. Available: ${Array.from(Object.keys(sectionsById)).join(', ')}.</div>`;
      }

      result += `\n${sectionsById.get(sectionId)}`;
    }

    return result;
  }

  const exhaustiveCheck: never = layout.type;

  throw new TrueImpactRuntimeException([
    new TrueImpactError(
      `Failed to build screen: ${input.id} with unsupported layout type: ${(exhaustiveCheck as unknown as TiSduiLayout).type}`,
    ),
  ]);
};
