import React, { useContext } from "react";
import { ThemeContext } from "../context/theme.context";
import { Sun, Moon } from "lucide-react";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      className="flex items-center gap-2 px-3 py-2 rounded-md 
                 bg-gray-200 hover:bg-gray-300 
                 dark:bg-gray-700 dark:hover:bg-gray-600 
                 transition-colors duration-200"
    >
      {theme === "light" ? (
        <>
          <Moon size={18} className="text-gray-700" />
          <span className="text-sm text-gray-800">Dark Mode</span>
        </>
      ) : (
        <>
          <Sun size={18} className="text-yellow-400" />
          <span className="text-sm text-gray-200">Light Mode</span>
        </>
      )}
    </button>
  );
};

export default ThemeToggle;
