import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/provider/theme-provider";
import { ControlPage } from "@/components/atoms/control-page";
import { ModeToggle } from "@/components/atoms/mode-toggle";
import { ControlAction } from "@/components/atoms/control-action";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Manhwa Video Editor",
  description:
    "A powerful tool for editing manhwa videos, powered by Gemini and Next.js.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <ControlPage />
          <ModeToggle />
          <ControlAction />
        </ThemeProvider>
      </body>
    </html>
  );
}
