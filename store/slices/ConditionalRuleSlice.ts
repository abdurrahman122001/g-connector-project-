import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Condition {
  _id?: string;
  targetField: string;
  operator: string;
  value?: string;
  isRepeater?: boolean;
  repeaterId?: string;
  checkboxValue?: string;
}

export interface Action {
  _id?: string;
  type: string;
  target: string;
  targetField: string;
  isRepeater?: boolean;
  repeaterId?: string;
}

// Add checkbox-specific operators
export const checkboxOperators = {
  isChecked: 'is checked',
  isNotChecked: 'is not checked',
  hasValue: 'has value',
  doesNotHaveValue: 'does not have value'
} as const;

// Add repeater-specific actions
export const repeaterActions = {
  showRepeater: 'Show Repeater',
  hideRepeater: 'Hide Repeater',


} as const;

export interface Rule {
  id: string;
  formId: string;
  name: string;
  matchType: 'all' | 'any';
  conditions: Condition[];
  actions: Action[];
  oppositeActions: boolean;
  enabled: boolean;
  isDirty: boolean;
}

export interface FieldDefinition {
  id: string;
  label: string;
  type: string | null;
  name?: string;
  options?: string[];
  parentRepeaterId?: string;
  parentRepeaterName?: string;
}

// NEW: Type definition for top-level repeater fields
export interface RepeatFieldDefinition {
  id: string;
  label: string;
  name: string;
}

interface ConditionalRuleState {
  rules: Rule[];
  formFields: FieldDefinition[];
  forms : any[],
  repeaterFormFields: RepeatFieldDefinition[]; // Add new state for repeater fields
}

const initialState: ConditionalRuleState = {
  rules: [],
  formFields: [],
  forms : [],
  repeaterFormFields: [] // Initialize new state
};

const ConditionalRuleSlice = createSlice({
  name: "conditionalRules",
  initialState,
  reducers: {
    addRule: (state, action: PayloadAction<Rule | null>) => {
      let newRule: Rule = {
        id: Date.now().toString(),
        name: '',
        formId : "",
        matchType: 'all',
        conditions: [],
        actions: [],
        oppositeActions: false,
        enabled: true,
        isDirty: false
      };

      if(action.payload){
        newRule = {...newRule, ...action.payload}
      }
      state.rules.push(newRule);
    },
    resetRule: () => {
      return initialState;
    },
    removeRule: (state, action: PayloadAction<string>) => {
      state.rules = state.rules.filter(rule => rule.id !== action.payload);
    },
    updateRule: (state, action: PayloadAction<{ id: string; updates: Partial<Rule> }>) => {
      const rule = state.rules.find(r => r.id === action.payload.id);
      if (rule) {
        Object.assign(rule, { ...action.payload.updates, isDirty: true });
      }


    },
    addCondition: (state, action: PayloadAction<{ ruleId: string; condition: Condition }>) => {
      const rule = state.rules.find(r => r.id === action.payload.ruleId);
      if (rule) {
        const newCondition = { ...action.payload.condition, _id: action.payload.condition._id || Date.now().toString() };
        rule.conditions.push(newCondition);
        rule.isDirty = true;
      }
    },
    removeCondition: (state, action: PayloadAction<{ ruleId: string; conditionIndex: number }>) => {
      const rule = state.rules.find(r => r.id === action.payload.ruleId);
      if (rule) {
        rule.conditions.splice(action.payload.conditionIndex, 1);
        rule.isDirty = true;
      }
    },
    addAction: (state, action: PayloadAction<{ ruleId: string; action: Action }>) => {
      const rule = state.rules.find(r => r.id === action.payload.ruleId);
      if (rule) {
        const newAction = { ...action.payload.action, _id: action.payload.action._id || Date.now().toString() };
        rule.actions.push(newAction);
        rule.isDirty = true;
      }
    },
    removeAction: (state, action: PayloadAction<{ ruleId: string; actionIndex: number }>) => {
      const rule = state.rules.find(r => r.id === action.payload.ruleId);
      if (rule) {
        rule.actions.splice(action.payload.actionIndex, 1);
        rule.isDirty = true;
      }
    },
    updateAction: (state, action: PayloadAction<{ ruleId: string; actionIndex: number; updates: Partial<Action> }>) => {
      const rule = state.rules.find(r => r.id === action.payload.ruleId);
      if (rule) {
        const actionToUpdate = rule.actions.find((a, index) => index === action.payload.actionIndex);
        if (actionToUpdate) {
          Object.assign(actionToUpdate, action.payload.updates);
          rule.isDirty = true;
        }
      }
    },
    setFormFields: (state, action: PayloadAction<FieldDefinition[]>) => {

      state.formFields = action.payload;
    },
    setForms: (state, action: PayloadAction<any[]>) => {

      state.forms = action.payload;
    },
    // NEW: Reducer to set top-level repeater fields
    setRepeaterFields: (state, action: PayloadAction<RepeatFieldDefinition[]>) => {
      state.repeaterFormFields = action.payload;
    },
    saveRule: (state, action: PayloadAction<Rule>) => {
      const rule = state.rules.find(r => r.id === action.payload.id);


      if(rule){
      Object.assign(rule, { ...action.payload, isDirty: false });
    }
      async function updateIt() {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forms/updateSkipLogic`, {
          method: "POST",
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token') ?? ''}` },
          body: JSON.stringify(action.payload),
        });

        
      }


      updateIt();

    },
    updateCondition: (state, action: PayloadAction<{ ruleId: string; conditionIndex: number; updates: Partial<Condition> }>) => {
      const rule = state.rules.find(r => r.id === action.payload.ruleId);
      if (rule) {
        const condition = rule.conditions.find((c, index) => index === action.payload.conditionIndex);
        if (condition) {
          Object.assign(condition, { ...action.payload.updates, _id: condition._id || action.payload.updates._id });
          rule.isDirty = true;
        }
      }
    }
  }
});

export const {
  addRule,
  removeRule,
  updateRule,
  addCondition,
  removeCondition,
  addAction,
  removeAction,
  setFormFields,
  setForms,
  setRepeaterFields,
  saveRule,
  
 resetRule ,
  updateCondition,
  updateAction
} = ConditionalRuleSlice.actions;

export default ConditionalRuleSlice.reducer;
