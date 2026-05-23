import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetchStudentDetails } from '@/src/services/CommonService';
import { AccessDetails, Program } from '@/src/types/commonTypes';

// Define a type for the slice state
interface CommonState {
    accessDetails: AccessDetails | null;
    StudentDetails: any;
}

// Initial state
const initialState: CommonState = {
    accessDetails: null,
    StudentDetails: null,
};

// Async thunk for fetchStudentData
export const fetchStudentData = createAsyncThunk('common/fetchStudentData', async (email: string, { rejectWithValue }) => {
    try {
        const response = await fetchStudentDetails({ email });
        return response.data;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch StudentDetails';
        return rejectWithValue(errorMessage);
    }
});

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
            // Only handle fulfilled for fetchStudentData
            .addCase(fetchStudentData.fulfilled, (state, action: PayloadAction<any>) => {
                state.StudentDetails = action.payload;
            });
    },
});

export const { clearAccessDetails } = commonSlice.actions;
export default commonSlice.reducer;