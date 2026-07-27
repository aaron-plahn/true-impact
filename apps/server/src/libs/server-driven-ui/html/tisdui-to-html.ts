import { TIScreen } from '../ti-screen';
import { tiSduiScreenToHtmlFragment } from './tisdui-to-html-fragment';

export const tiSduiToHtml = (input: TIScreen): string => {
  return `
    <!Doctype html>
    <html>
        <head>
            <meta charset="utf-8" />
            <title>${input.title}</title>
            <style>
                /* Global Styles */

                * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
                }

                body {
                font-family: Arial, sans-serif;
                background-color: #f2f2f2; /* Light gray */
                }

                /* Header Styles */

                #BEGIN_SURVEY {
                max-width: 800px;
                margin: 40px auto;
                text-align: center;
                }

                a {
                    color: #3498db; /* Main blue color */
                    font-size: clamp(4rem, 4vw + 1rem, 8rem);
                    text-decoration: none;
                    text-align: center;
                }

                p {
                    color: #3498db; /* Main blue color */
                    font-size: clamp(2rem, 4vw + 1rem, 4rem);
                }

                h3 {
                color: #3498db; /* Main blue color */
                font-weight: bold;
                margin-bottom: 20px;
                }

                /* Form Styles */

                form.ti-form {
                background-color: #e5f5ff; /* Light blue */
                padding: 30px;
                border: 1px solid #ccc;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                input[type="hidden"],
                button[type="submit"] {
                    background-color: #3498db; /* Main blue color */
                    color: #fff;
                    border: none;
                    padding: 10px;
                    font-size: 16px;
                }

                button[type="submit"]:hover {
                background-color: #2ecc71; /* Lighter greenish-blue */
                cursor: pointer;
                }

                /* Responsive Styles */

                @media (max-width: 768px) {
                #BEGIN_SURVEY {
                    max-width: none;
                    width: 100%;
                    padding: 20px;
                }
                }

                @media (min-width: 769px) and (max-width: 1024px) {
                #BEGIN_SURVEY {
                    max-width: 700px;
                }
                }

                @media (min-width: 1025px) {
                #BEGIN_SURVEY {
                    max-width: 800px;
                }
                }

            </style>
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
