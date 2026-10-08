import AppHeader from "../components/desktop/AppHeader";
import Sidebar from "../components/desktop/Sidebar";
import StatusBar from "../components/desktop/StatusBar";

import * as React from "react";

interface DesktopLayoutProps {
  activeRoute: string;
  onNavigate: (route: string) => void;
  children: React.ReactNode;
}

export default function DesktopLayout({
  activeRoute,
  onNavigate,
  children,
}: DesktopLayoutProps) {
  return React.createElement(
    "div",
    {
      className:
        "h-screen w-screen flex flex-col bg-slate-100",
    },

    // Header
    React.createElement(AppHeader, {
      onNavigate,
    }),

    // Main application area
    React.createElement(
      "div",
      {
        className:
          "flex flex-1 min-h-0",
      },

      // Sidebar
      React.createElement(Sidebar, {
        active: activeRoute,
        onNavigate,
      }),

      // Page content
      React.createElement(
        "main",
        {
          className:
            "flex-1 min-w-0 overflow-auto",
        },
        children,
      ),
    ),

    // Status bar
    React.createElement(StatusBar),
  );
}