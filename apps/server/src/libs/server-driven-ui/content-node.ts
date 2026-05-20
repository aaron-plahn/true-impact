import { TISduiForm } from './forms';

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

export interface ActionContentNode {
  type: 'ACTION';
  id: string;
  title: string;
  // this is meant to appear as the label on the submission button
  label: string;
  // this is meant to appear as a tooltip
  description: string;
  form: TISduiForm;
  // these are inspired by [htmx](https://htmx.org/docs/#introduction)'s `hx-swap` attribute \ corresponding strategies
  swap: 'outer'; // | 'inner' | 'first' | 'last' | 'delete' | 'none';
}

export interface LinkContentNode {
  type: 'LINK';
  id: string;
  title: string;
  href: string;
}

export type ContentNode =
  | TextContentNode
  | ImageContentNode
  | ActionContentNode
  | LinkContentNode;
