import { TIScreen } from '../ti-screen';
import { tiSduiScreenToHtmlFragment } from './tisdui-to-html-fragment';

export const tiSduiToHtml = (input: TIScreen): string => {
  return `
    <!Doctype html>
    <html>
        <head>
            <meta charset="utf-8" />
            <title>${input.title}</title>
        </head>
        <body>
            ${tiSduiScreenToHtmlFragment(input)}
            <script>
                // TODO make these stand-alone scripts
                // TODO bundler
                const renderDiffFromServer = (diff) =>{
                    const elToUpdate = document.getElementById(diff.target);

                    if(!elToUpdate){
                        throw new Error('Failed to update target element with ID:' + diff.target)
                    }

                    if(diff.swap === "outer"){
                        elToUpdate.outerHTML = diff.content;
                        return;
                    }

                    console.log("unsupported swap strategy for TI SDUI: " + e.swap);
                }

                const submitCommandForm = async (e) => {

                e.preventDefault();

                const formData = new FormData(e.target);

                const payload = Object.fromEntries(formData.entries());


                if("aggregateCompositeIdentifier" in payload){
                    payload.aggregateCompositeIdentifier = JSON.parse(payload.aggregateCompositeIdentifier);
                }

                const commandType = e.target.dataset.commandType;

                if(typeof commandType !== 'string' || commandType.length === 0){
                    console.warn("Invalid command type: " + commandType);
                }

                const fsa = {
                    type: commandType,
                    payload,
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
                        Accept: 'text/json',
                    },
                    });

                   const result = await response.json();

                    if (response.status !== 201) {
                        render('<div>' + response?.message || 'unknown error' + '</div>');
                    }

                   renderDiffFromServer(result);

                    return;
                } catch (error) {
                    const msg = error?.message || 'Unexpected Server Error';

                    console.log({badFsa: fsa});

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
