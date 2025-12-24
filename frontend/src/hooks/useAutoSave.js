import { useEffect } from "react";

export const useAutoSave = (key, value) => {
  useEffect(() => {
    if (!value) return;
    const interval = setInterval(() => {
      console.log("Auto-saving data...");
      localStorage.setItem(key, value);
    }, 2000);

    return () => clearInterval(interval);
  }, [key, value]);
};
