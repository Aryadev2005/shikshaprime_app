import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetchTeacherDetails } from '@/src/services/CommonService';
import { AccessDetails, Program } from '@/src/types/commonTypes';

// Define a type for the slice state
interface CommonState {
    accessDetails: AccessDetails | null;
    TeacherDetails: any;
}

// Initial state
const initialState: CommonState = {
    accessDetails: null,
    TeacherDetails: null,
};

// Async thunk for fetchStudentData
export const fetchTeacherData = createAsyncThunk('common/fetchTeacherData', async (userCode: string, { rejectWithValue }) => {
    console.log("Teacher user code 01", userCode);
    try {
        const response = await fetchTeacherDetails({ userCode });
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
            .addCase(fetchTeacherData.fulfilled, (state, action: PayloadAction<any>) => {
                state.TeacherDetails = action.payload;
            });
    },
});

export const { clearAccessDetails } = commonSlice.actions;
export default commonSlice.reducer;