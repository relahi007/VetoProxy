import { createContext, useContext, useReducer } from "react";

const AppStateContext = createContext(null);

const initialState = {
  currentPolicy: null,
  currentResults: null,
  auditBlocks: [],
  verifyResult: null,
};

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_POLICY":
      return { ...state, currentPolicy: action.payload };
    case "SET_RESULTS":
      return { ...state, currentResults: action.payload };
    case "SET_AUDIT_BLOCKS":
      return { ...state, auditBlocks: action.payload };
    case "SET_VERIFY_RESULT":
      return { ...state, verifyResult: action.payload };
    case "CLEAR_ALL":
      return initialState;
    default:
      return state;
  }
};

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setPolicy = (policy) =>
    dispatch({ type: "SET_POLICY", payload: policy });
  const setResults = (results) =>
    dispatch({ type: "SET_RESULTS", payload: results });
  const setAuditBlocks = (blocks) =>
    dispatch({ type: "SET_AUDIT_BLOCKS", payload: blocks });
  const setVerifyResult = (result) =>
    dispatch({ type: "SET_VERIFY_RESULT", payload: result });
  const clearAll = () => dispatch({ type: "CLEAR_ALL" });

  return (
    <AppStateContext.Provider
      value={{
        ...state,
        setPolicy,
        setResults,
        setAuditBlocks,
        setVerifyResult,
        clearAll,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  return useContext(AppStateContext);
}