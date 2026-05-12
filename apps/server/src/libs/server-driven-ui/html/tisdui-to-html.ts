import { TIScreen } from '../ti-screen';
import { actionToHtml } from './action-to-html';

export const tiSduiToHtml = (input: TIScreen): string => {
  const sections = Array.from(Object.values(input.sectionsById));

  const section = sections[0];

  const text = section.nodes.reduce((acc, node) => {
    if (node.type === 'TEXT') {
      acc += `\n${node.text}`;
    }

    if (node.type === 'ACTION') {
      acc += `\n${actionToHtml(node)}`;
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
            <script>
                const submitCommandForm = (e) =>{
                    console.log({e});

                    e.preventDefault();

                    const formData = new FormData(e.target);

                    const fsa = {
                        type: 'BEGIN_SURVEY',
                        payload: Object.fromEntries(formData.entries())
                    };


                    fetch('/surveys/commands',{ method: 'POST', body: JSON.stringify(fsa), headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' } });
                }
            </script>
        </body>
    </html>
    `;
};
