import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetchClasses } from '@/src/services/CommonService';
import { AccessDetails, Classes } from '@/src/types/commonTypes';

// Define a type for the slice state
interface CommonState {
    accessDetails: AccessDetails | null;
    classes: Classes[] | null;
}

// Initial state
const initialState: CommonState = {
    accessDetails: null,
    classes: null,
};

// Async thunk for fetchClasses
export const fetchClassesData = createAsyncThunk('common/fetchClassesData', async (_, { rejectWithValue }) => {
    try {
        const response = await fetchClasses();
        return response.data;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch academic years';
        return rejectWithValue(errorMessage);
    }
}
);

export const commonSlice = createSlice({
    name: 'common',
    initialState,
    reducers: {
        clearAccessDetails: (state) => {
            state.accessDetails = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Only handle fulfilled for fetchClassesData
            .addCase(fetchClassesData.fulfilled, (state, action: PayloadAction<[]>) => {
                state.classes = action.payload;
            });
    },
});

export const { clearAccessDetails } = commonSlice.actions;

export default commonSlice.reducer;