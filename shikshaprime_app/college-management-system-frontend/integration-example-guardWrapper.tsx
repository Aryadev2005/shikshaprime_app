// Example: How to integrate FloatingChatWidget into your existing guardWrapper.tsx

"use client";
import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuthGuard } from "@/src/hooks/useAuthGuard";
import Header from "@/src/components/global/header";
import Sidebar from "@/src/components/global/sidebar";
import { FooterPage } from "@/components/ui/FooterPage";
import { cn } from "@/src/lib/utils";

// ADD THIS IMPORT for the chat widget
import FloatingChatWidget from "@/src/components/chat/FloatingChatWidget";

// Define unguarded route prefixes  
const unguardedPrefixes = [
  "/auth/login",
  "/public",
  "/student-registration",
  "/online-registration",
  "/student-payment",
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

  // Common Layout Wrapper - MODIFIED to include FloatingChatWidget
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

      {/* FLOATING CHAT WIDGET - ADD THIS BLOCK */}
      {user && process.env.NEXT_PUBLIC_CHAT_ENABLED === 'true' && (
        <FloatingChatWidget 
          currentUser={{
            user_id: user.user_code || user.user_id,
            role: user.role || user.user_type,
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            email: user.email || ''
          }} 
        />
      )}
    </div>
  );

  // Rest of your existing component logic remains the same...
  
  if (isUnguarded) {
    // For unguarded routes, render children without layout
    return <>{children}</>;
  }

  if (isOfflineRegistration) {
    return <DashboardLayout role="admin">{children}</DashboardLayout>;
  }

  if (isStudentSelection) {
    return <DashboardLayout role="admin">{children}</DashboardLayout>;
  }

  if (isStudentAdmission) {
    return <DashboardLayout role="admin">{children}</DashboardLayout>;
  }

  if (isStudentAttendance) {
    return <DashboardLayout role="teacher">{children}</DashboardLayout>;
  }

  if (isChangePassword) {
    return <DashboardLayout>{children}</DashboardLayout>;
  }

  // Default layout with user's actual role
  return <DashboardLayout>{children}</DashboardLayout>;
}

/* 
NOTES:
1. The FloatingChatWidget only appears when:
   - User is authenticated (user exists)
   - NEXT_PUBLIC_CHAT_ENABLED environment variable is set to 'true'
   - User role is not 'admin' (handled inside the component)

2. The currentUser prop is mapped from your existing user object structure
   to match what the chat widget expects.

3. The widget will automatically position itself in the bottom-right corner
   and won't interfere with your existing layout.

4. If you need to exclude chat from specific routes, you can add conditions
   like: !pathname.startsWith('/some-route') in the widget render condition.
*/