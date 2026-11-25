import { useState } from "react";
import { JSX } from "react/jsx-runtime";
import { TISduiFormField } from "../../../shared/dynamic-form-field";
import { DynamicFormField } from "./dynamic-form-field";

export interface DynamicFormProps {
  // Name? Description? method? path?
  label: string;
  // tooltip: string;
  fields: TISduiFormField[];
  /**
   * The server binds commands to a particular view (by `aggregateCompositeIdentifier`)
   * or even to a nested property on a view (such as prepopulating the `questionLabel` on a survey management command).
   * This minimizes out-of-band knowledge required and hence the maintenance load on the client.
   */
  // Can we just wrap this into `onSubmit`?
  context: Record<string, unknown>;
  onSubmit: (formState: Record<string, unknown>) => void;

  // TODO dynamic schema-based validation rules (beyond `required` which we already support)
}

export const DynamicForm = ({
  fields,
  label,
  context,
  onSubmit,
}: DynamicFormProps): JSX.Element => {
  const [formState, setFormState] = useState<Record<string, unknown>>(context);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();

        onSubmit(formState);
      }}
    >
      {/* stack? */}
      {fields.map((field) => {
        return (
          <DynamicFormField
            {...field}
            onChange={(newValue) => {
              setFormState({
                ...formState,
                [field.name]: newValue,
              });
            }}
          />
        );
      })}
      <button type="submit">{label}</button>
    </form>
  );
};
