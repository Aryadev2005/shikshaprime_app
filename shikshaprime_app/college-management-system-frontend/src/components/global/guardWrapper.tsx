"use client";
import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuthGuard } from "@/src/hooks/useAuthGuard";
import Header from "./header";
import Sidebar from "./sidebar";
import { FooterPage } from "@/components/ui/FooterPage";
import { cn } from "@/src/lib/utils";
import FloatingChatWidget from "@/src/components/chat/FloatingChatWidget";

// Define unguarded route prefixes
const unguardedPrefixes = [
  "/auth/login",
  "/public",
  "/student-registration",
  "/online-registration",
  "/student-payment",
  "/payment/callback",
  "/admin/student-registration-offline",
  "/admin/student-selection",
  "/admin/student-admission",
  "/dashboard/student-registration-offline",
  "/dashboard/student-selection",
  "/teacher/student-attendance",
  "/change-password"
];

export default function GuardWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Check if current path starts with any unguarded prefix
  const isUnguarded = unguardedPrefixes.some(prefix =>
    pathname.trim().startsWith(prefix)
  );

  console.log(`GuardWrapper: path="${pathname}", isUnguarded=${isUnguarded}`);

  const isOfflineRegistration = pathname.startsWith("/admin/student-registration-offline") || pathname.startsWith("/dashboard/student-registration-offline");
  const isStudentSelection = pathname.startsWith("/admin/student-selection") || pathname.startsWith("/dashboard/student-selection");
  const isStudentAdmission = pathname.startsWith("/admin/student-admission") || pathname.startsWith("/student-admission");
  const isStudentAttendance = pathname.startsWith("/teacher/student-attendance");
  const isChangePassword = pathname.startsWith("/change-password");


  const user = useAuthGuard(!isUnguarded);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isUnguarded && !user) {
    // Block protected routes until redirect happens
    return null;
  }
  if (user) {
    console.log("user ======>", user);
  }

  const handleMenuClick = () => {
    if (window.innerWidth >= 768) {
      setIsCollapsed(!isCollapsed);
    } else {
      setIsMobileOpen(!isMobileOpen);
    }
  };

  // Common Layout Wrapper
  const DashboardLayout = ({ children, role }: { children: ReactNode; role?: string }) => (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Sidebar
        forcedRole={role}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isCollapsed={isCollapsed}
      />

      <div className={cn(
        "flex flex-col transition-all duration-300 min-h-screen",
        isCollapsed ? "md:ml-20" : "md:ml-64"
      )}>
        <Header onMenuClick={handleMenuClick} />
        <main className="flex-1 p-2 md:p-4 overflow-x-hidden bg-[var(--color-background)]">
          {children}
          <FooterPage />
        </main>
      </div>
      
      {/* Floating Chat Widget - only show for authenticated non-admin users */}
      {user && user.role !== 'admin' && user.user_type !== 'admin' && (
        <>
          {console.log('🔍 GuardWrapper user object for chat:', user)}
          {console.log('🔍 Available user properties:', Object.keys(user))}
          {console.log('🔍 user.user_code:', user.user_code)}
          {console.log('🔍 user.role:', user.role)}
          <FloatingChatWidget 
            currentUser={{
              user_id: user.user_code?.toString() || user.user_id?.toString() || '',
              role: user.user_type || user.role || '',
              first_name: user.first_name || '',
              last_name: user.last_name || '',
              email: user.email || ''
            }}
          />
        </>
      )}
    </div>
  );

  // Special cases: Routes that need layout but are unguarded
  if (isOfflineRegistration || isStudentSelection || isStudentAdmission || isStudentAttendance || isChangePassword) {
    return <DashboardLayout role={user ? undefined : "offline"}>{children}</DashboardLayout>;
  }

  // For other unguarded routes, just render children (no header/sidebar)
  if (isUnguarded) {
    return <>{children}</>;
  }

  // For guarded routes, render full layout
  return <DashboardLayout>{children}</DashboardLayout>;
}
