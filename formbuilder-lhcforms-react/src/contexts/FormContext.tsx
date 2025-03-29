import React, { createContext, useContext, useReducer, ReactNode } from 'react';

interface FormState {
  formData: any;
  selectedItem: any | null;
  isLoading: boolean;
  error: string | null;
}

type FormAction =
  | { type: 'SET_FORM_DATA'; payload: any }
  | { type: 'SET_SELECTED_ITEM'; payload: any }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: FormState = {
  formData: null,
  selectedItem: null,
  isLoading: false,
  error: null,
};

const FormContext = createContext<{
  state: FormState;
  dispatch: React.Dispatch<FormAction>;
} | null>(null);

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FORM_DATA':
      return { ...state, formData: action.payload };
    case 'SET_SELECTED_ITEM':
      return { ...state, selectedItem: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

export function FormProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(formReducer, initialState);

  return (
    <FormContext.Provider value={{ state, dispatch }}>
      {children}
    </FormContext.Provider>
  );
}

export function useForm() {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useForm must be used within a FormProvider');
  }
  return context;
}