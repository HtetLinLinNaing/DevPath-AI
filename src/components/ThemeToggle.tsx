"use client";

import { Button } from "@heroui/react";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
  localStorage.setItem("devpath-theme", theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = localStorage.getItem("devpath-theme");
    const nextTheme: Theme = stored === "dark" || stored === "light"
      ? stored
      : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  return (
    <Button
      isIconOnly
      radius="full"
      size="lg"
      variant="flat"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      onPress={toggleTheme}
      className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
    >
      {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
    </Button>
  );
}
