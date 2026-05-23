import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetchDepartments } from '@/src/services/CommonService';
import { AccessDetails, Department } from '@/src/types/commonTypes';

// Define a type for the slice state
interface CommonState {
    accessDetails: AccessDetails | null;
    departments: Department[] | null;
}

// Initial state
const initialState: CommonState = {
    accessDetails: null,
    departments: null,
};

// Async thunk for fetchDepartmentData
export const fetchDepartmentData = createAsyncThunk('common/fetchDepartmentData', async (_, { rejectWithValue }) => {
    try {
        const response = await fetchDepartments();
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
            // Only handle fulfilled for fetchDepartmentData
            .addCase(fetchDepartmentData.fulfilled, (state, action: PayloadAction<[]>) => {
                state.departments = action.payload;
            });
    },
});

export const { clearAccessDetails } = commonSlice.actions;

export default commonSlice.reducer;