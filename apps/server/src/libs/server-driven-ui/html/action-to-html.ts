import { TrueImpactError } from 'src/libs/data-types';
import { ActionContentNode } from '../content-node';

export const actionToHtml = ({
  id,
  title,
  label,
  form,
  swap,
}: ActionContentNode) => {
  const { fields, action } = form;

  if (swap !== 'outer') {
    throw new TrueImpactError(`Unsupported TISdui swap operation: ${swap}`);
  }

  const renderedFields = fields
    .map((field) => {
      const { name, label } = field;

      const fieldId = `${id}_${name}`;

      if (field.type === 'TEXT_INPUT') {
        return `<label for=${fieldId}>
                ${label}
                </label>
                <input type="text" name=${name} id=${fieldId} />
                `;
      }

      return `<div>Unsupported field type: ${field.type}</div>`;
    })
    .join('\n');

  const _onSubmit = `
    (e) =>{
      console.log({e});

      e.preventDefault();

      const formData = new FormData(e.target);

      const fsa = {
        payload: Object.fromEntries(formData.entries())
      };

      fetch('${action.path}', { method: ${action.method}, body: fsa });
    }
  `;

  return `
 <form id=${id} class="ti-form" onsubmit="submitCommandForm(event)">
    <h3>${title}</h3>
    ${renderedFields}
    <button type="submit">${label}</button>
 </form>
 `;
};
