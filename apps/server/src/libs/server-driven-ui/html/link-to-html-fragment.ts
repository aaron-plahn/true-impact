import { LinkContentNode } from '../content-node';

export const linkToHtmlFragment = (link: LinkContentNode): string => {
  const { href, title } = link;

  return `<a href="${href}">${title}</a>`;
};
