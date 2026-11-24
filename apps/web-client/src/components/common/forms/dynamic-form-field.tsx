import { JSX } from "react/jsx-runtime";
import { TISduiFormField } from "../../../shared/dynamic-form-field";
import { DatePicker } from "./date-picker";
import { DynamicSelector } from "./dynamic-selector";
import { MultiTextInput } from "./multi-text-input";
import { TextInputField } from "./text-input";

export const DynamicFormField = (field: TISduiFormField): JSX.Element => {
  const { type: fieldType } = field;

  if (fieldType === "DATE_PICKER") {
    const { name, label, isRequired } = field;

    return (
      <DatePicker
        name={name}
        label={label}
        isRequired={Boolean(isRequired)}
        value={""}
        onChange={function (newValue: string | undefined): void {
          throw new Error("Function not implemented.");
        }}
      />
    );
  }

  if (fieldType === "DYNAMIC_SELECTOR") {
    const { name, path } = field;

    return (
      <DynamicSelector
        name={name}
        onChange={function (newValue: string | undefined): void {
          throw new Error("Function not implemented.");
        }}
        searchUrl={path}
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
        value={""}
        onChange={function (newValue: string | undefined): void {
          throw new Error("Function not implemented.");
        }}
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
        onChange={function (newValues: string[]): void {
          throw new Error("Function not implemented.");
        }}
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
