import { TISduiForm } from '../forms';

export const formToHtml = (form: TISduiForm) => {
  const { id, title, label, fields, action } = form;

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

  return `
 <form id=${id} class="ti-form" action=${action.path}>
    <h3>${title}</h3>
    ${renderedFields}
    <button type="submit">${label}</button>
 </form>
 `;
};
