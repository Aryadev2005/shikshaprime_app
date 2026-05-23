import type { Metadata } from "next";
import "./globals.css";
import GuardWrapper from "@/src/components/global/guardWrapper";
import { ClientProviders } from "@/src/providers/clientProviders";
import { ReactNode } from "react";
import '@fortawesome/fontawesome-svg-core/styles.css';
import { config } from '@fortawesome/fontawesome-svg-core';
config.autoAddCss = false;

export const metadata: Metadata = {
  title: "ShikshaPrime College Management System",
  description: "ShikshaPrime Education Platform",
  icons: {
    icon: `${process.env.NEXT_PUBLIC_BASE_PATH}/vercel.svg`,
  },
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientProviders>          
          <GuardWrapper>
            {children}
          </GuardWrapper>
        </ClientProviders>
      </body>
    </html>
  );
}
