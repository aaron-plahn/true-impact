interface TIReplace {
  strategy: 'outer' | 'inner' | 'page';
  target: string;
}

export interface Action {
  id: string;
  // form: Form
  label: string;
  description: string;
  method: 'GET' | 'POST';
  url: string;
  replace?: TIReplace;
}
