"use client";
import React, { useContext, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthContext } from "@/src/context/authContext";
import { menuConfig } from "@/src/config/ui/menuConfig";
import { cn } from "@/src/lib/utils";
import { LogOut, GraduationCap } from "lucide-react";
import Image from 'next/image';
import './sidebar.css';

// ... imports

interface SidebarProps {
  forcedRole?: string;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
  isCollapsed?: boolean;
}

export default function Sidebar({ forcedRole, isMobileOpen, setIsMobileOpen, isCollapsed = false }: SidebarProps) {
  const { user, logout } = useContext(AuthContext)!;
  const pathname = usePathname();
  const [isHovered, setIsHovered] = React.useState(false);

  const role = user?.role || forcedRole;

  if (!role) return null;

  const items = menuConfig[role as keyof typeof menuConfig] || [];

  // Close menu when clicking a link on mobile
  const handleLinkClick = () => {
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  useEffect(() => {
    console.log("Sidebar items:", items);
  }, [items])

  // Determine if sidebar should be wide (either not collapsed, or collapsed but hovered)
  // On mobile, it's always wide (256px / w-64) but hidden/shown via transform
  // On desktop:
  // - collapsed=false: w-64
  // - collapsed=true + hovered=true: w-64
  // - collapsed=true + hovered=false: w-20
  const isExpanded = !isCollapsed || isHovered;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen?.(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen flex-col text-white transition-all duration-300 ease-in-out shadow-2xl",
          // Mobile transform logic
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 left-side-bar",
          // Desktop width logic
          (!isMobileOpen && isCollapsed && !isHovered) ? "md:w-20" : "md:w-64"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Sidebar Header / Logo */}
        <div className={cn("flex h-20 items-center px-3", (!isMobileOpen && isCollapsed && !isHovered) ? "justify-center" : "")}>
          <div className="flex items-center gap-3 font-bold text-xl tracking-wide overflow-hidden whitespace-nowrap">
            {(!isMobileOpen && isCollapsed && !isHovered) ? (              
              <Image src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/flower.svg`} alt="Logo" width={30} height={30} className="min-w-[30px]" />
            ) : (
              <Image src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/logo.svg`} alt="Logo" width={150} height={50} className="min-w-[150px]" />
            )}
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto py-3 px-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          <nav className="space-y-1.5">
            {items?.map((item: any) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              const isImageIcon = typeof Icon === 'string';

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={handleLinkClick}
                  className={cn(
                    "group flex items-center gap-3 rounded-sm px-3 py-3 text-sm font-medium transition-all duration-200 relative overflow-hidden whitespace-nowrap",
                    isActive
                      ? "bg-gradient-to-r from-orange-500/0 to-orange-600/90 text-white shadow-md"
                      : "text-gray-300 hover:bg-white/10 hover:text-white",
                    // Center icon when collapsed
                    (!isMobileOpen && isCollapsed && !isHovered) ? "justify-center" : ""
                  )}
                  title={isCollapsed && !isHovered ? item.label : ""}
                >
                  {Icon && (
                    isImageIcon ? (
                      <div className={cn("relative h-5 w-5 transition-transform duration-200", (!isMobileOpen && isCollapsed && !isHovered) ? "" : "mr-1", "group-hover:scale-110")}>
                        <Image
                          src={Icon}
                          alt={item.label}
                          fill
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <Icon
                        className={cn(
                          "h-5 w-5 transition-transform duration-200 group-hover:scale-110 min-w-[1.25rem]",
                          isActive ? "text-white" : "text-gray-400 group-hover:text-white"
                        )}
                      />
                    )
                  )}

                  {/* Label - hide when collapsed */}
                  <span className={cn(
                    "relative z-10 transition-opacity duration-300",
                    (!isMobileOpen && isCollapsed && !isHovered) ? "opacity-0 hidden" : "opacity-100"
                  )}
                  >
                    {item.label}
                  </span>

                  {isActive && (
                    <div className="absolute right-0 top-0 h-full w-1 bg-white/20 blur-[2px]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer / Logout */}
        <div className="border-t border-white/10 p-4">
          <button
            onClick={logout}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg bg-white/5 py-2.5 text-sm font-medium text-white/70 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 border border-transparent transition-all duration-200 group overflow-hidden whitespace-nowrap",
              (!isMobileOpen && isCollapsed && !isHovered) ? "justify-center" : "justify-center"
            )}
            title={isCollapsed && !isHovered ? "Logout" : ""}
          >
            <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform min-w-[1rem]" />
            <span className={cn(
              "transition-opacity duration-300",
              (!isMobileOpen && isCollapsed && !isHovered) ? "opacity-0 hidden" : "opacity-100"
            )}
            >Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
