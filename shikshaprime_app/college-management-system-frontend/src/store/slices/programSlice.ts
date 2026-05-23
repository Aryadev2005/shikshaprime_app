import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetchPrograms } from '@/src/services/CommonService';
import { AccessDetails, Program } from '@/src/types/commonTypes';

// Define a type for the slice state
interface CommonState {
    accessDetails: AccessDetails | null;
    programs: Program[] | null;
}

// Initial state
const initialState: CommonState = {
    accessDetails: null,
    programs: null,
};

// Async thunk for fetchProgramData
export const fetchProgramData = createAsyncThunk('common/fetchProgramData', async (_, { rejectWithValue }) => {
    try {
        const response = await fetchPrograms();
        return response.data;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch programs';
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
            // Only handle fulfilled for fetchProgramData
            .addCase(fetchProgramData.fulfilled, (state, action: PayloadAction<[]>) => {
                state.programs = action.payload;
            });
    },
});

export const { clearAccessDetails } = commonSlice.actions;

export default commonSlice.reducer;