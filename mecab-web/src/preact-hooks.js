import { createContext } from '../web_modules/preact.js';
import { useState, useContext, useMemo, useEffect } from '../web_modules/preact--hooks.js';
// https://github.com/developit/unistore/issues/136

const StoreContext = createContext(store);
export const Provider = StoreContext.Provider;

function runReducer(state, reducer) {
  if (typeof reducer==='function') return reducer(state);
  const out = {};
  if (Array.isArray(reducer)) for (let i of reducer) out[i] = state[i];
  else if (reducer) for (let i in reducer) out[i] = state[reducer[i]];
  return out;
}

function bindActions(store, actions) {
  if (typeof actions=='function') actions = actions(store);
  const bound = {};
  for (let i in actions) bound[i] = store.action(actions[i]);
  return bound;
}

export function useStore(reducer, actions) {
  const { store } = useContext(StoreContext);
  const [state, set] = useState(runReducer(store.getState(), reducer));
  useEffect(() => store.subscribe(state => {
      set(runReducer(state, reducer));
  }));
  const boundActions = useMemo(bindActions, [store, actions]);
  return [state, boundActions];
}