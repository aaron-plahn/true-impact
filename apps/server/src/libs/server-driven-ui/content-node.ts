export interface TextContentNode {
  id: string;
  type: 'TEXT';
  text: string;
}

export interface ImageContentNode {
  id: string;
  type: 'IMAGE';
  source: string; // URL ?
  alternativeText: string;
  caption?: string;
}

export type ContentNode = TextContentNode | ImageContentNode;
