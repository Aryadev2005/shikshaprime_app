"use client";
import { AuthContext } from "@/src/context/authContext";
import { useContext, useEffect, useState, useRef } from "react";
import { Menu, User as UserIcon, ChevronDown, KeyRound, LogOut, User } from "lucide-react";
import { cn } from "@/src/lib/utils";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import NotificationBell from "./NotificationBell";
import { HelpModal } from "./HelpModal";

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useContext(AuthContext)!;
  const pathname = usePathname();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [userType, setUserType] = useState("");

  // ... rest of titles and logic
  const routeTitles: Record<string, string> = {
    "/admin/student-admission": "Student Admission",
    "/admin/student-selection": "Student Selection",
    "/admin/payment": "Payment",
    "/admin/create-teacher": "Create Teacher",
    "/admin/staff-attendance": "Staff Attendance",
    "/admin/student-registration-offline": "Student Registration (Offline)",
    "/dashboard/admin": "Admin Dashboard",
    "/online-registration": "Online Registration",
    "/student-payment": "Student Payment",
    "/teacher/students": "Students",
    "/dashboard/teacher": "Dashboard",
    "/teacher/student-attendance": "Student Attendance",
    "/teacher/assignment-homework": "Assignment",
    "/teacher/assignment-check": "Assignment",
    "/change-password": "Change Password",
    "/admin/students": 'Student',
    "/student/student-assignment": 'Student Assignment',
    "/student/view-attendance": "Student Attendance",
    "/student/payment-dashboard": "Student Payment"
  };

  let currentTitle = routeTitles[pathname] || "ShikshaPrime";

  if (pathname.startsWith("/student/student-assignment/view/")) {
    currentTitle = "Student Assignment";
  }
  if (pathname.startsWith("/student/student-assignment/")) {
    currentTitle = "Student Assignment Form";
  }
  if (pathname.startsWith("/teacher/students/")) {
    currentTitle = "Student";
  }
  if (pathname.startsWith("/admin/teachers/")) {
    currentTitle = "Teacher";
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      console.log("save user", JSON.parse(savedUser)?.user_type);
      setUserType(JSON.parse(savedUser)?.user_type)
    }
  }, []);

  const profile = () => {
    setShowDropdown(false);
    if (userType === "admin") {
      router.push("/admin/profile");
    }
    else if (userType === "teacher") {
      router.push("/teacher/profile");
    }
    else if (userType === "student") {
      router.push("/student/profile");
    }
  }


  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-white px-4 shadow-sm md:px-2">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            if (onMenuClick) onMenuClick();
          }}
          className="rounded-md md:p-2 p-0 hover:bg-gray-100 md:visible cursor-pointer"
        >
          <img src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/icons/menu-icon.svg`} alt="Logo" width={24} height={24} className="ml-1" />
        </button>
        {/* Page Title / Breadcrumb */}
        {user && <h1 className="md:text-[1.3rem] text-[0.8rem] font-bold text-[var(--text-dark)]">{currentTitle}</h1>}
        {!user && <span className="hidden md:block text-sm font-medium text-gray-500">Welcome back, Guest</span>}
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell - Always visible */}
        <NotificationBell />
        <button
          className="cursor-pointer"
          onClick={() => setIsHelpModalOpen(true)}
        >
          <img src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/icons/help-icon.svg`} alt="Help" width={20} height={20} className="ml-1" />
        </button>
        {user && (
          <>
            {/* User Profile Dropdown */}
            <div className="flex items-center gap-3 pl-2 border-l border-gray-200" ref={dropdownRef}>
              <div className="hidden text-right md:block">
                <p className="text-sm font-semibold text-gray-700">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.username}</p>
              </div>
              <div className="relative">
                <div
                  className="flex items-center gap-2 cursor-pointer group"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <div className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold border border-orange-200 group-hover:bg-orange-200 transition-colors">
                    <Image src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/icons/user-icon.svg`} alt="" width={34} height={34} />
                  </div>
                  <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", showDropdown && "rotate-180")} />
                </div>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      minWidth: "200px",
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                      zIndex: 50,
                      overflow: "hidden",
                    }}
                  >
                    {/* User Info */}
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
                      <p style={{ fontSize: "14px", fontWeight: 600, color: "#374151" }}>
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p style={{ fontSize: "12px", color: "#9ca3af" }}>{user?.email}</p>
                    </div>
                    {
                      (userType === "student" || userType === "teacher") && (
                        <div style={{ padding: "4px 0" }}>
                          <button
                            onClick={() => profile()}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              width: "100%",
                              padding: "10px 16px",
                              fontSize: "14px",
                              color: "#374151",
                              backgroundColor: "transparent",
                              border: "none",
                              cursor: "pointer",
                              textAlign: "left",
                              transition: "background-color 0.15s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                          >
                            <User className="h-4 w-4" style={{ color: "#6b7280" }} />
                            Profile
                          </button>
                        </div>
                      )
                    }

                    <div style={{ padding: "4px 0" }}>
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          router.push("/change-password");
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          width: "100%",
                          padding: "10px 16px",
                          fontSize: "14px",
                          color: "#374151",
                          backgroundColor: "transparent",
                          border: "none",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "background-color 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <KeyRound className="h-4 w-4" style={{ color: "#6b7280" }} />
                        Change Password
                      </button>
                      <div style={{ height: "1px", backgroundColor: "#f3f4f6", margin: "2px 0" }} />
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          logout();
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          width: "100%",
                          padding: "10px 16px",
                          fontSize: "14px",
                          color: "#ef4444",
                          backgroundColor: "transparent",
                          border: "none",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "background-color 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fef2f2")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <LogOut className="h-4 w-4" style={{ color: "#ef4444" }} />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        {!user && (
          <div className="text-sm font-medium text-gray-500">Guest Access</div>
        )}
      </div>

      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </header>
  );
}
