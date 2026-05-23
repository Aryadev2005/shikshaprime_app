import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetchAcademicYears } from '@/src/services/CommonService';
import { AccessDetails, AccessAuthorizePayload, AcademicYear } from '@/src/types/commonTypes';

// Define a type for the slice state
interface CommonState {
    accessDetails: AccessDetails | null;
    academicYears: AcademicYear[] | null;
}

// Initial state
const initialState: CommonState = {
    accessDetails: null,
    academicYears: null,
};

// Async thunk for fetchAcademicYears
export const fetchAcademicYearsData = createAsyncThunk('common/fetchAcademicYearsData', async (_, { rejectWithValue }) => {
    try {
        const response = await fetchAcademicYears();
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
            // Only handle fulfilled for fetchAccessDetails
            // .addCase(fetchAccessDetails.fulfilled, (state, action: PayloadAction<AccessDetails>) => {
            //     state.accessDetails = action.payload;
            // })
            // Only handle fulfilled for fetchAcademicYearsData
            .addCase(fetchAcademicYearsData.fulfilled, (state, action: PayloadAction<[]>) => {
                state.academicYears = action.payload;
            });
    },
});

export const { clearAccessDetails } = commonSlice.actions;

export default commonSlice.reducer;