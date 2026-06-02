import { TIScreen } from '../ti-screen';
import { tiSduiToHtmlFragment } from './tisdui-to-html-fragment';

export const tiSduiToHtml = (input: TIScreen): string => {
  return `
    <!Doctype html>
    <html>
        <head>
            <meta charset="utf-8" />
            <title>${input.title}</title>
        </head>
        <body>
            ${tiSduiToHtmlFragment(input)}
            <script>
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
                        Accept: 'text/html',
                    },
                    });

                    const result = await response.text();

                    if (response.status !== 201) {
                    render('<div>Shoot! Fix me.</div>');
                    }



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
            <script src="https://cdn.socket.io/3.1.3/socket.io.min.js" integrity="sha384-cPwlPLvBTa3sKAgddT6krw0cJat7egBga3DJepJyrLl4Q9/5WLra3rrnMcyTyOnh" crossorigin="anonymous"></script>
            <script>
                      const target = document.getElementById('root');

          const wsUri = 'ws://localhost:3234/survey-events';
          const socket = io(wsUri, { transports: ['websocket'], autoConnect: true });

          const send = () =>{
            socket.emit("SOME_EVENT",{message: 'Another one bites the dust!'});

          };


          socket.on('SOME_EVENT', ({ message }) => {
            target.innerHTML += ", " +message;
          });

          socket.on('SURVEY_UPDATED', (e)=>{

            const elToUpdate = document.getElementById(e.target);

            if(!elToUpdate){
              throw new Error('Failed to update target element with ID:' + e.target)
            }

            if(e.swap === "outer"){
              elToUpdate.outerHTML = e.content;
              return;
            }

            console.log({unsupportedEvent: e});
          })
            </script>
        </body>
    </html>
    `;
};
