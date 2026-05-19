import { ContentNode } from './content-node';

export class Section {
  id: string;
  type: string;
  classes: Set<string>;
  nodes: ContentNode[];
}
