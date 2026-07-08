import { TrueImpactError } from '../../../libs/data-types';
import { ActionContentNode } from '../content-node';

export const actionToHtmlFragment = ({
  id,
  title,
  label,
  form,
  swap,
}: ActionContentNode) => {
  const { fields, action, context } = form;

  if (swap !== 'outer') {
    throw new TrueImpactError(
      `Unsupported TISdui swap operation: ${swap as unknown as string}`,
    );
  }

  const hiddenFieldsFromContext = Array.from(Object.entries(context))
    .map(([key, value]: [string, unknown]) => {
      const serializedValue =
        typeof value === 'boolean' ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'undefined' ||
        value === null
          ? value
          : JSON.stringify(value);

      return `<input type="hidden" name="${key}" value='${serializedValue}'/>`;
    })
    .join('');

  const renderedFields = fields
    .map((field) => {
      const { name: fieldName, label: fieldLabel } = field;

      const fieldId = `${id}_${fieldName}`;

      if (field.type === 'TEXT_INPUT') {
        return `<label for="${fieldId}">
                ${fieldLabel}
                </label>
                <input type="text" name="${fieldName}" id="${fieldId}" />
                `;
      }

      if (field.type === 'SINGLE_SELECT_INPUT') {
        return `<fieldset>
          <legend>${fieldLabel}</legend>
          ${field.options
            .map(
              (o, optionIndex) =>
                // TODO use a fully qualified ID here
                `<div><input type="radio" name="${fieldName}" id=${o.value} value=${o.value} ${optionIndex === 0 ? 'checked' : ''}/>${o.label}<label for=${o.label}></label></div>`,
            )
            .join('')}
        </fieldset>`;
      }

      const exhaustiveCheck: never = field;

      return `<div>Unsupported type for form field: ${JSON.stringify(exhaustiveCheck)}</div>`;
    })
    .concat(hiddenFieldsFromContext)
    .join('\n');

  const _onSubmit = `
    (e) =>{
      e.preventDefault();

      const formData = new FormData(e.target);

      const fsa = {
        payload: Object.fromEntries(formData.entries())
      };

      fetch('${action.path}', { method: ${action.method}, body: fsa });
    }
  `;

  return `
 <form id=${id} class="ti-form" onsubmit="submitCommandForm(event)" data-command-type="${action.type}">
    <h3>${title}</h3>
    ${renderedFields}
    <button type="submit">${label}</button>
 </form>
 `;
};
