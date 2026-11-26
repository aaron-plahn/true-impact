import { JSX } from "react/jsx-runtime";
import { TISduiFormField } from "../../../shared/dynamic-form-field";
import { DatePicker } from "./date-picker";
import { DynamicSelector } from "./dynamic-selector";
import { MultiTextInput } from "./multi-text-input";
import { TextInputField } from "./text-input";

type DynamicFormFieldProps<TValue = unknown> = TISduiFormField & {
  onChange: (newValue: TValue) => void;
};

export const DynamicFormField = (field: DynamicFormFieldProps): JSX.Element => {
  const { type: fieldType, onChange } = field;

  if (fieldType === "DATE_PICKER") {
    const { name, label, isRequired } = field;

    return (
      <DatePicker
        name={name}
        label={label}
        isRequired={Boolean(isRequired)}
        value={""}
        onChange={onChange}
      />
    );
  }

  if (fieldType === "DYNAMIC_SELECTOR") {
    const { name, path, isRequired } = field;

    return (
      <DynamicSelector
        name={name}
        onChange={onChange}
        searchUrl={path}
        isRequired={isRequired}
      />
    );
  }

  if (fieldType === "TEXT_INPUT") {
    const { name, label, isRequired } = field;

    return (
      <TextInputField
        name={name}
        label={label}
        isRequired={Boolean(isRequired)}
        // TODO bind to the form state
        // Note that we need to use a dynamic form with a text field to hit this
        value={""}
        onChange={onChange}
      />
    );
  }

  if (fieldType === "MULTIPLE_TEXT_INPUT") {
    const { name, label } = field;

    // TODO tooltip?
    // TODO make use of label for every form field
    return (
      <MultiTextInput
        name={name}
        label={label}
        onChange={(newValue) => {
          onChange(newValue);
        }}
        // TODO use this (See comment for TextInputField)
        values={[]}
      />
    );
  }

  if (fieldType === "SINGLE_SELECT_INPUT") {
    return <div>Single Select Input</div>;
  }

  const exhaustiveCheck: never = fieldType;

  return <div>Unsupported Form Field Type: {exhaustiveCheck}</div>;
};
