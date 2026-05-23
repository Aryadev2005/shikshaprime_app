import { configureStore } from '@reduxjs/toolkit';
import academicReducer from './slices/academicSlice';
import classesReducer from './slices/classesSlice';
import departmentsReducer from './slices/departmentSlice';
import programsReducer from './slices/programSlice'
import studentReducer from './slices/studentDetialsSlice'
import teacherReducer from './slices/teacherDetailsSlice'

export const store = configureStore({
    reducer: {
        academic: academicReducer,
        classes: classesReducer,
        departments: departmentsReducer,
        programs: programsReducer,
        stuDetails: studentReducer,
        teaDetails: teacherReducer,
    },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
