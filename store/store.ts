import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage"; // uses localStorage
import ConditionalReducer from "./slices/ConditionalRuleSlice"
import FileUploadFetch from "./slices/FileUploadFetchSlice"
import UserLoginReducer from "./slices/UserLoginSlice"

const rootReducer = combineReducers({
  conditionalReducer: ConditionalReducer,
  fileUpload: FileUploadFetch,
  userLogin: UserLoginReducer
});

const persistConfig = {
  key: "root",
  storage,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export const persistor = persistStore(store);

// Infer the `RootState`
export type RootState = ReturnType<typeof store.getState>;