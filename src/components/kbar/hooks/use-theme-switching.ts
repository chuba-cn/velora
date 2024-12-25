import { useTheme } from "next-themes";
import {type Action, useRegisterActions} from 'kbar'

const useThemeSwitching = () => {

  const { theme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  const themeAction: Action[] = [
    {
      id: "toggleTheme",
      name: "Toggle Theme",
      shortcut: ["t", "t"],
      section: "Theme",
      perform: toggleTheme,
    },
    {
      id: "setLightTheme",
      name: "Set Light Theme",
      shortcut: ["l", "t"],
      section: "Theme",
      perform: () => setTheme("light"),
    },
    {
      id: "setDarkTheme",
      name: "Set Dark Theme",
      shortcut: ["d", "t"],
      section: "Theme",
      perform: () => setTheme("dark"),
    },
  ];

  useRegisterActions(themeAction, [theme])

}

export default useThemeSwitching