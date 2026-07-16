/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { ThemeType, LayoutPreferences } from "../types/layout";

export interface ShellContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  preferences: LayoutPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<LayoutPreferences>>;
  activeNavId: string;
  setActiveNavId: (id: string) => void;
  currentVenue: string;
  setCurrentVenue: (venue: string) => void;
  currentMatch: string;
  setCurrentMatch: (match: string) => void;
  isJudgeMode: boolean;
  setIsJudgeMode: (judge: boolean) => void;
}

const ShellContext = React.createContext<ShellContextType | undefined>(undefined);

export const ShellProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = React.useState<ThemeType>("default");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState<boolean>(false);
  const [activeNavId, setActiveNavId] = React.useState<string>("dashboard");
  const [currentVenue, setCurrentVenue] = React.useState<string>("Lusail Stadium, Sector G");
  const [currentMatch, setCurrentMatch] = React.useState<string>("Argentina vs France (Group A)");
  
  const [isJudgeMode, setIsJudgeMode] = React.useState<boolean>(false);
  
  const [preferences, setPreferences] = React.useState<LayoutPreferences>({
    denseMode: false,
    showCopilotPanel: false,
    showSystemHealth: true,
  });

  // Track and synchronize document metadata-theme attribute for CSS variable styling
  const setTheme = React.useCallback((newTheme: ThemeType) => {
    setThemeState(newTheme);
    if (newTheme === "default") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", newTheme);
    }
  }, []);

  // Initialize theme attribute on mount
  React.useEffect(() => {
    if (theme === "default") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme]);

  const value = React.useMemo(() => ({
    theme,
    setTheme,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    preferences,
    setPreferences,
    activeNavId,
    setActiveNavId,
    currentVenue,
    setCurrentVenue,
    currentMatch,
    setCurrentMatch,
    isJudgeMode,
    setIsJudgeMode,
  }), [
    theme,
    setTheme,
    isSidebarCollapsed,
    preferences,
    activeNavId,
    currentVenue,
    currentMatch,
    isJudgeMode,
  ]);

  return (
    <ShellContext.Provider value={value}>
      {children}
    </ShellContext.Provider>
  );
};

export const useShell = (): ShellContextType => {
  const context = React.useContext(ShellContext);
  if (!context) {
    throw new Error("useShell must be used within a ShellProvider");
  }
  return context;
};
