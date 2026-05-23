"use client";
import { AuthProvider, AuthContext } from "@/src/context/authContext";
import { NotificationProvider } from "@/src/context/notificationContext";
import { Toaster } from "sonner";
import { Provider } from "react-redux";
import { store } from "@/src/store/store";

import { useEffect, useRef, useContext } from "react";
import { useAppDispatch } from "@/src/store/hooks";
import { fetchAcademicYearsData } from "@/src/store/slices/academicSlice";
import { fetchClassesData } from "@/src/store/slices/classesSlice";
import { fetchDepartmentData } from "@/src/store/slices/departmentSlice";
import { fetchProgramData } from "../store/slices/programSlice";
import { fetchStudentData } from "../store/slices/studentDetialsSlice";
import { fetchTeacherData } from "../store/slices/teacherDetailsSlice";

function AppInitializer({ children }: { children: React.ReactNode }) {
  const { user, logout } = useContext(AuthContext)!;
  const dispatch = useAppDispatch();
  const auth = useContext(AuthContext);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      dispatch(fetchAcademicYearsData());
      dispatch(fetchClassesData());
      dispatch(fetchDepartmentData());
      dispatch(fetchProgramData());
    }
  }, [dispatch]);

  useEffect(()=>{console.log("Auth data =====>", auth)}, [auth])

  useEffect(() => {
    console.log("Auth=====>", auth?.user?.user_type, user);
    
    if (auth?.user?.email && auth?.user?.user_type === "student") {
      dispatch(fetchStudentData(auth.user.email));
    }
    if (auth?.user?.user_type === "teacher") {
      console.log("Fetch teacher data ====>", auth?.user?.user_type);
      dispatch(fetchTeacherData(auth.user.user_code));
    }
  }, [user, auth?.user?.email, dispatch])
  return <>{children}</>;
}

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthProvider>
        <AppInitializer>
          <NotificationProvider>
            {children}
          </NotificationProvider>
          <Toaster position="top-right" richColors closeButton />
        </AppInitializer>
      </AuthProvider>
    </Provider>
  );
}
