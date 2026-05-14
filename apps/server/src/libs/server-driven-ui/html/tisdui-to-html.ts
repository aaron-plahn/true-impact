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
                const submitCommandForm = async (e) => {
                console.log({ e });

                e.preventDefault();

                const formData = new FormData(e.target);

                const fsa = {
                    type: 'BEGIN_SURVEY',
                    payload: Object.fromEntries(formData.entries()),
                };

                const render = (newHtml) => {
                    e.target.outerHTML = newHtml;
                };

                try {
                    const response = await fetch('/surveys/commands-html', {
                    method: 'POST',
                    body: JSON.stringify(fsa),
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'text/html',
                    },
                    });

                    const result = await response.text();

                    if (response.status !== 201) {
                    render('<div>Shoot! Fix me.</div>');
                    }

                    console.log({result,response});


                    render(result);

                    return;
                } catch (error) {
                    const msg = error?.message || 'Unexpected Server Error';

                    const msgAsHtml =
                    '<div><h2>Server Error</h2><p>' +
                    msg +
                    '</p><p>Please try again later.</p></div>';

                    render(msgAsHtml);

                    return;
                }
                };

            </script>
        </body>
    </html>
    `;
};
