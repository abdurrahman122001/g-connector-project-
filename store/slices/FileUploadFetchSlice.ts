import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface FileUploadState {
    mapColumns: string[];
}

const initialState: FileUploadState = {
    mapColumns: [],
};

const FileUploadFetchSlice = createSlice({
    name: "fileUpload",
    initialState,
    reducers: {
        mapColumns: (state, action: PayloadAction<string[]>) => {
            state.mapColumns =  action.payload;
        },
    },
});

export const { mapColumns } = FileUploadFetchSlice.actions;
export default FileUploadFetchSlice.reducer;
