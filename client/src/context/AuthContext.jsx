import { createContext, useContext, useReducer, useEffect } from 'react';
import { getMe } from '../api/auth';

const AuthContext = createContext(null);

const initialState = { user: null, token: localStorage.getItem('token'), loading: true };

function reducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      localStorage.setItem('token', action.token);
      return { ...state, user: action.user, token: action.token, loading: false };
    case 'LOGOUT':
      localStorage.removeItem('token');
      return { user: null, token: null, loading: false };
    case 'SET_USER':
      return { ...state, user: action.user, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (state.token) {
      getMe()
        .then((res) => dispatch({ type: 'SET_USER', user: res.data }))
        .catch(() => dispatch({ type: 'LOGOUT' }));
    } else {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
    // Run once on mount — token is read from localStorage at init.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = (user, token) => dispatch({ type: 'LOGIN', user, token });
  const logout = () => dispatch({ type: 'LOGOUT' });

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
