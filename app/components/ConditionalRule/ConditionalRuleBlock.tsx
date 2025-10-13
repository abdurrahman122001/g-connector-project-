"use client"
import { useEffect, useRef, useState, useCallback } from "react";
import { FiPlus, FiCheck, FiCopy, FiTrash2 } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { removeRule, updateRule, addCondition, removeCondition, addAction, removeAction, saveRule, addRule, RepeatFieldDefinition, FieldDefinition, updateCondition, updateAction, Condition, Action } from "../../../store/slices/ConditionalRuleSlice";
import { RootState } from "@/store/store";
import Common from "./Common";
import { checkboxOperators, repeaterActions } from "../../../store/slices/ConditionalRuleSlice";

interface ConditionalRuleBlockProps {
  id: string;
  formId: string;
  repeaterFormFields: RepeatFieldDefinition[];
  formFields: FieldDefinition[];
}

interface ConditionFormProps {
  ruleId: string;
  formFields: FieldDefinition[];
  repeaterFormFields: RepeatFieldDefinition[];
  onAdd: (condition: Condition) => void;
  onCancel: () => void;
}

interface ActionFormProps {
  ruleId: string;
  formFields: FieldDefinition[];
  repeaterFormFields: RepeatFieldDefinition[];
  onAdd: (action: Action) => void;
  onCancel: () => void;
  actionTypes: string[];
  getTargetFieldsForActionType: (actionType: string) => (FieldDefinition | RepeatFieldDefinition)[];
  getTargetTypeForAction: (actionType: string) => string;
}

const AddConditionForm: React.FC<ConditionFormProps> = ({ ruleId, formFields, repeaterFormFields, onAdd, onCancel }) => {
  const [selectedField, setSelectedField] = useState(formFields[0]?.id || '');
  const [selectedOperator, setSelectedOperator] = useState('is present');
  const [selectedValue, setSelectedValue] = useState('');

  const getOperatorsForField = useCallback((fieldId: string) => {
    const field = formFields.find(f => f.id === fieldId);
    if (!field) return [];
    
    if (field.type === 'checkbox') {
      return Object.values(checkboxOperators);
    }
    
    const operators = Common.inputs[field.type as keyof typeof Common.inputs];
    return operators ? Object.values(operators) : [];
  }, [formFields]);

  const getSelectedField = useCallback(() => {
    return formFields.find(f => f.id === selectedField);
  }, [formFields, selectedField]);

  const handleAddClick = () => {
    const field = getSelectedField();
    onAdd({
      targetField: selectedField,
      operator: selectedOperator,
      value: selectedValue,
      isRepeater: field?.parentRepeaterId ? true : false,
      repeaterId: field?.parentRepeaterId
    });
  };

  const selectedFieldObj = getSelectedField();
  const isCheckbox = selectedFieldObj?.type === 'checkbox';
  const showValueInput = !isCheckbox && (
    selectedOperator === 'equals' ||
    selectedOperator === 'does not equal' ||
    selectedOperator === 'starts with' ||
    selectedOperator === 'ends with' ||
    selectedOperator === 'contains' ||
    selectedOperator === 'does not contains'
  );

  return (
    <div className="flex items-center gap-2 mb-4 p-2 border border-gray-200 rounded-md bg-gray-50">
      <select
        className="border border-gray-300 rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={selectedField}
        onChange={(e) => setSelectedField(e.target.value)}
      >
        {formFields.map((field) => (
          <option key={field.id} value={field.id}>
            {field.label}
          </option>
        ))}
      </select>
      <select
        className="border border-gray-300 rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={selectedOperator}
        onChange={(e) => setSelectedOperator(e.target.value)}
      >
        {getOperatorsForField(selectedField).map((operator: string) => (
          <option key={operator} value={operator}>
            {operator}
          </option>
        ))}
      </select>

      {showValueInput && (
        <input
          type="text"
          className="border border-gray-300 rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedValue}
          onChange={(e) => setSelectedValue(e.target.value)}
          placeholder="Value"
        />
      )}
      
      <button
        onClick={handleAddClick}
        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
      >
        <FiPlus /> Add
      </button>
      <button
        onClick={onCancel}
        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
      >
        <FiTrash2 /> Cancel
      </button>
    </div>
  );
};

const AddActionForm: React.FC<ActionFormProps> = ({ ruleId, formFields, repeaterFormFields, onAdd, onCancel, actionTypes, getTargetFieldsForActionType, getTargetTypeForAction }) => {
  const [selectedActionType, setSelectedActionType] = useState<string>('Show');
  const [selectedTargetField, setSelectedTargetField] = useState(formFields[0]?.id || '');

  const handleAddClick = () => {
    const targetType = getTargetTypeForAction(selectedActionType);
    const targetFieldId = selectedTargetField;

    onAdd({
      type: selectedActionType,
      target: targetType,
      targetField: targetFieldId,
      repeaterId: targetType === 'repeater' ? selectedTargetField : undefined
    });
  };

  return (
    <div className="flex items-center gap-2 mb-4 p-2 border border-gray-200 rounded-md bg-gray-50">
      <select
        className="border border-gray-300 rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={selectedActionType}
        onChange={(e) => {
          setSelectedActionType(e.target.value);
          setSelectedTargetField(getTargetFieldsForActionType(e.target.value)[0]?.id || '');
        }}
      >
        {actionTypes.map((actionType: string) => (
          <option key={actionType} value={actionType}>{actionType}</option>
        ))}
      </select>
      <select
        className="border border-gray-300 rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={selectedTargetField}
        onChange={(e) => setSelectedTargetField(e.target.value)}
      >
        {getTargetFieldsForActionType(selectedActionType).map((field: FieldDefinition | RepeatFieldDefinition) => (
          <option key={field.id} value={field.id}>
            {field.label}
          </option>
        ))}
      </select>
      
      <button
        onClick={handleAddClick}
        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
      >
        <FiPlus /> Add
      </button>
      <button
        onClick={onCancel}
        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
      >
        <FiTrash2 /> Cancel
      </button>
    </div>
  );
};

const ConditionalRuleBlock: React.FC<ConditionalRuleBlockProps> = ({ id, formId, repeaterFormFields, formFields }) => {
  const dispatch = useDispatch();
  const rule = useSelector((state: RootState) => 
    state.conditionalReducer.rules.find((r: { id: string }) => r.id === id)
  );
  const defaultForm = useSelector((state: RootState) => 
    state.conditionalReducer.forms
  );

  
  // Filter form fields to include all input types
  const filteredFormFields = formFields.filter((field: FieldDefinition) => 
    field.type !== 'submit' && field.type !== 'button'
  );

  const nameDesc = useRef<HTMLInputElement>(null);
  const [showAddConditionForm, setShowAddConditionForm] = useState(false);
  const [showAddActionForm, setShowAddActionForm] = useState(false);

  if (!rule) return null;

  const getOperatorsForField = useCallback((fieldId: string) => {
    const field = filteredFormFields.find(f => f.id === fieldId);
    if (!field) return [];
    
    if (field.type === 'checkbox') {
      return Object.values(checkboxOperators);
    }
    
    const operators = Common.inputs[field.type as keyof typeof Common.inputs];
    return operators ? Object.values(operators) : [];
  }, [filteredFormFields]);

  const getIsCheckboxForField = useCallback((fieldId: string) => {
    const field = filteredFormFields.find(f => f.id === fieldId);
    return field?.type === 'checkbox';
  }, [filteredFormFields]);

  const getOptionsForField = useCallback((fieldId: string) => {
    const field = filteredFormFields.find(f => f.id === fieldId);
    return field?.options || [];
  }, [filteredFormFields]);

  const handleDelete = useCallback(() => {
    dispatch(removeRule(id));
  }, [dispatch, id]);

  const handleSave = useCallback(() => {
    
    dispatch(saveRule({...rule, formId : formId}));
  }, [dispatch, rule]);

  const handleCopy = useCallback(() => {
    const newRule = { ...rule, id: Date.now().toString() };
    dispatch(addRule(null));
    dispatch(updateRule({ id: newRule.id, updates: newRule }));
  }, [dispatch, rule]);

  const handleMatchTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(updateRule({ id, updates: { matchType: e.target.value as 'all' | 'any' } }));
  }, [dispatch, id]);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(updateRule({ id, updates: { name: e.target.value } }));
  }, [dispatch, id]);

  const handleOppositeActionsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(updateRule({ id, updates: { oppositeActions: e.target.checked } }));
  }, [dispatch, id]);

  const handleEnabledChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(updateRule({ id, updates: { enabled: e.target.checked } }));
  }, [dispatch, id]);

  const handleAddConditionClick = useCallback(() => {
    setShowAddConditionForm(true);
  }, []);

   const handleAddActionClick = useCallback(() => {
    setShowAddActionForm(true);
   }, []);

   const handleConditionAdded = useCallback((condition: Condition) => {
    dispatch(addCondition({ ruleId: id, condition }));
   }, [dispatch, id]);

    const handleActionAdded = useCallback((action: Action) => {
        dispatch(addAction({ ruleId: id, action }));
    }, [dispatch, id]);

    const handleCancelAddCondition = useCallback(() => {
        setShowAddConditionForm(false);
    }, []);

    const handleCancelAddAction = useCallback(() => {
        setShowAddActionForm(false);
    }, []);

  const actionTypes = [
    'Show', 'Hide', 'Enable', 'Disable', 'Require', 'Optional', 'Populate',
    ...Object.values(repeaterActions)
  ];

  const getTargetFieldsForActionType = useCallback((actionType: string) => {
    if (Object.values(repeaterActions).includes(actionType as any)) {
      return repeaterFormFields;
    }
    return formFields;
  }, [formFields, repeaterFormFields]);

  const getTargetTypeForAction = useCallback((actionType: string) => {
    if (Object.values(repeaterActions).includes(actionType as any)) {
      return 'repeater';
    }
    return 'field';
  }, []);

  return (
    <div className="border-gray-200 mb-6">
      {/* Main Content */}
      <div className="p-6">
        {/* Name/Description */}
        <input
          type="text"
          ref={nameDesc}
          value={rule.name}
          onChange={handleNameChange}
          placeholder="Name / Description"
          className="w-full border-0 border-b border-gray-200 rounded-none px-0 py-2 text-lg text-gray-500 placeholder-gray-400 mb-6 focus:ring-0 focus:border-blue-500"
        />

        {/* Condition Section */}
        <div className="mb-4">
           <div className="flex flex-wrap items-center gap-2 mb-2">
                <select
                className="border border-gray-300 rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={rule.matchType}
                onChange={handleMatchTypeChange}
                >
                <option value="all">All</option>
                <option value="any">Any</option>
                </select>
                <span className="text-base text-gray-700">of the following conditions:</span>
                 {/* Add Condition and Add Group Buttons placed here */}
                <button
                    onClick={handleAddConditionClick}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1 ml-2"
                >
                    <FiPlus /> Add condition
                </button>
           
                 {/* Rule action buttons on the right */}
                <div className="flex items-center gap-2 ml-auto">
                    {rule.isDirty && (
                    <span className="text-yellow-600 border border-yellow-500 px-3 py-1 text-sm rounded bg-yellow-50">
                        Unsaved Changes
                    </span>
                    )}
                    <button
                    onClick={handleSave}
                    className="bg-green-600 hover:bg-green-700 text-white p-2 rounded"
                    >
                    <FiCheck />
                    </button>
                    <button
                    onClick={handleCopy}
                    className="bg-blue-700 hover:bg-blue-800 text-white p-2 rounded"
                    >
                    <FiCopy />
                    </button>
                    <button
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded"
                    >
                    <FiTrash2 />
                    </button>
                </div>
            </div>
           
            {/* Add Condition Form */}
            {showAddConditionForm && (
              <AddConditionForm 
                ruleId={id} 
                formFields={filteredFormFields} 
                repeaterFormFields={repeaterFormFields}
                onAdd={handleConditionAdded}
                onCancel={handleCancelAddCondition}
              />
            )}

            {/* Display Conditions */}
            <div className="space-y-3">
                {rule.conditions.map((condition, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border border-gray-200 rounded-md bg-white">
                        <select
                            className="border border-gray-300 rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={condition.targetField}
                            onChange={(e) => {
                                const updatedCondition = { ...condition, field: e.target.value };
                                dispatch(updateCondition({ ruleId: id, conditionIndex: index, updates: updatedCondition }));
                            }}
                        >
                            {filteredFormFields.map((field) => (
                                <option key={field.id} value={field.id}>
                                    {field.label}
                                </option>
                            ))}
                        </select>
                        <select
                            className="border border-gray-300 rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={condition.operator}
                            onChange={(e) => {
                                const updatedCondition = { ...condition, operator: e.target.value };
                                dispatch(updateCondition({ ruleId: id, conditionIndex: index, updates: updatedCondition }));
                            }}
                        >
                            {getOperatorsForField(condition.targetField).map((operator: string) => (
                                <option key={operator} value={operator}>
                                    {operator}
                                </option>
                            ))}
                        </select>
                        {getIsCheckboxForField(condition.targetField) && ['has value', 'does not have value'].includes(condition.operator) && (
                            <select
                                className="border border-gray-300 rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={condition.checkboxValue || ''}
                                onChange={(e) => {
                                    const updatedCondition = { ...condition, checkboxValue: e.target.value };
                                    dispatch(updateCondition({ ruleId: id, conditionIndex: index, updates: updatedCondition }));
                                }}
                            >
                                <option value="">Select a value</option>
                                {getOptionsForField(condition.targetField).map((option: string) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        )}
                        {!getIsCheckboxForField(condition.targetField) && (
                            condition.operator === 'equals' || 
                            condition.operator === 'does not equal' || 
                            condition.operator === 'starts with' || 
                            condition.operator === 'ends with' || 
                            condition.operator === 'contains' || 
                            condition.operator === 'does not contains'
                        ) && (
                            <input
                                type="text"
                                className="border border-gray-300 rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={condition.value || ''}
                                onChange={(e) => {
                                    const updatedCondition = { ...condition, value: e.target.value };
                                    dispatch(updateCondition({ ruleId: id, conditionIndex: index, updates: updatedCondition }));
                                }}
                                placeholder="Value"
                            />
                        )}
                        <button
                            onClick={() => dispatch(removeCondition({ ruleId: id, conditionIndex: index }))}
                            className="text-red-600 hover:text-red-700 p-2 rounded"
                        >
                            <FiTrash2 />
                        </button>
                    </div>
                ))}
            </div>
        </div>

         {/* Action Section */}
        <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-base text-gray-700">Executes the following actions:</span>
                <button
                    onClick={handleAddActionClick}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1 ml-2"
                >
                    <FiPlus /> Add action
                </button>
            </div>

            {/* Add Action Form */}
            {showAddActionForm && (
                <AddActionForm 
                    ruleId={id} 
                    formFields={filteredFormFields} 
                    repeaterFormFields={repeaterFormFields}
                    onAdd={handleActionAdded}
                    onCancel={handleCancelAddAction}
                    actionTypes={actionTypes}
                    getTargetFieldsForActionType={getTargetFieldsForActionType}
                    getTargetTypeForAction={getTargetTypeForAction}
                />
            )}

            {/* Display Actions */}
            <div className="space-y-3 mt-4">
                {rule.actions.map((action, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border border-gray-200 rounded-md bg-white">
                        <select
                            className="border border-gray-300 rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={action.type}
                            onChange={(e) => {
                                const updatedAction = { ...action, type: e.target.value };
                                dispatch(updateAction({ ruleId: id, actionIndex: index, updates: updatedAction }));
                            }}
                        >
                            {actionTypes.map((type: string) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        <select
                            className="border border-gray-300 rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={action.targetField}
                            onChange={(e) => {
                                const updatedAction = {
                                    ...action,
                                    target: getTargetTypeForAction(action.type),
                                    targetField: e.target.value
                                };
                                dispatch(updateAction({ ruleId: id, actionIndex: index, updates: updatedAction }));
                            }}
                        >
                            {getTargetFieldsForActionType(action.type).map((field: FieldDefinition | RepeatFieldDefinition) => (
                                <option key={field.id} value={field.id}>
                                    {field.label}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => dispatch(removeAction({ ruleId: id, actionIndex: index }))}
                            className="text-red-600 hover:text-red-700 p-2 rounded"
                        >
                            <FiTrash2 />
                        </button>
                    </div>
                ))}
            </div>
        </div>

        <div className="flex items-center gap-4 mt-4">
        
          <label className="inline-flex items-center text-base text-gray-700 gap-1">
            <input
              type="checkbox"
              className="form-checkbox text-blue-600"
              checked={rule.enabled}
              onChange={handleEnabledChange}
            />
            Enabled
          </label>
        </div>
      </div>
    </div>
  );
}

export default ConditionalRuleBlock;
