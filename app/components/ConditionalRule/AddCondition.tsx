import React, { useState } from 'react';
import { ChangeEvent } from 'react';

// import styles from './AddCondition.module.css'; // Removed CSS module import

const AddCondition = () => {
  // State for the first select (Action)
  const [actionOptions, setActionOptions] = useState([
    { value: 'toShow', label: 'Show' },
    { value: 'toHide', label: 'Hide' },
    { value: 'toEnable', label: 'Enable' },
    { value: 'toDisable', label: 'Disable' },
    { value: 'copy', label: 'Copy' },
    { value: 'performArithmeticOperations', label: 'Math' },
    { value: 'evaluateMathFormula', label: 'Evaluate' },
    { value: 'formatNumber', label: 'Format Number' },
    { value: 'formatText', label: 'Format Text' },
    { value: 'skip', label: 'Skip' },
    { value: 'form', label: 'Form' },
  ]);
  const [selectedAction, setSelectedAction] = useState(actionOptions[0].value);
  const [actionName, setActionName] = useState('action-select');

  // State for the second select (Target)
  const [targetOptions, setTargetOptions] = useState([
    { value: 'field', label: 'Field' },
    { value: 'element', label: 'Element' },
  ]);
  const [selectedTarget, setSelectedTarget] = useState(targetOptions[0].value);
  const [targetName, setTargetName] = useState('target');

  // State for the third select (Target Field)
  const [targetFieldOptions, setTargetFieldOptions] = useState([
    { value: 'radio_1', label: 'Programming Language' },
    { value: 'checkbox_1', label: 'PHP Frameworks' },
    { value: 'checkbox_2', label: 'JavaScript Frameworks' },
    { value: 'hidden_1', label: 'Subtotal-PHP' },
    { value: 'hidden_2', label: 'Subtotal-JavaScript' },
    { value: 'text_1', label: 'Coupon code' },
    { value: 'hidden_3', label: 'Subtotal-Coupon' },
    { value: 'hidden_4', label: 'Discount' },
    { value: 'hidden_5', label: 'Subtotal' },
    { value: 'hidden_6', label: 'Total' },
    { value: 'button_1', label: 'Buy Now!' },
  ]);
  const [selectedTargetField, setSelectedTargetField] = useState(targetFieldOptions[0].value);
  const [targetFieldName, setTargetFieldName] = useState('targetField');

  // Handler for select changes
  const handleActionChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedAction(event.target.value);
  };

  const handleTargetChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedTarget(event.target.value);
  };

  const handleTargetFieldChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedTargetField(event.target.value);
  };


  return (
    // Applied Tailwind classes for flex layout, spacing, border, and background
    <div className="flex items-center gap-2 p-4 border border-gray-200 rounded-md mb-4 bg-white">
      {/* Applied Tailwind classes for select elements */}
      <select
        className="flex-grow p-2 border border-gray-300 rounded-md form-select"
        name={actionName}
        value={selectedAction}
        onChange={handleActionChange}
      >
        {actionOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Applied Tailwind classes for select elements */}
      <select
        className="flex-grow p-2 border border-gray-300 rounded-md form-select"
        name={targetName}
        value={selectedTarget}
        onChange={handleTargetChange}
      >
        {targetOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Applied Tailwind classes for select elements */}
      <select
        className="flex-grow p-2 border border-gray-300 rounded-md form-select"
        name={targetFieldName}
        value={selectedTargetField}
        onChange={handleTargetFieldChange}
      >
        {targetFieldOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Applied Tailwind classes for the button */}
      <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:opacity-90 btn btn-danger btn-sm">
        <span className="fa fa-times"></span> Delete
      </button>
    </div>
  );
};

export default AddCondition;
