"use client";
import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    return (
        <button type="button" onClick={toggleTheme} className="p-2 rounded-md hover:bg-gray-100/10">
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
    );
}
