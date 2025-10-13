import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  _id: string;
  name: string;
  email: string;
  
  role: 'admin' | 'user';
  active: boolean;
}

interface UserLoginState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserLoginState = {
  user: null,
  loading: false,
  error: null
};

const userLoginSlice = createSlice({
  name: 'userLogin',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      
      state.user = action.payload;
      state.loading = false;
      state.error = null;
    },
    clearUser: (state) => {
      state.user = null;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    }
  }
});

export const { setUser, clearUser, setLoading, setError } = userLoginSlice.actions;
export default userLoginSlice.reducer;
