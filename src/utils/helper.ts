import { useState, useEffect } from "react";
import type { GetAllMessage } from "../dto/response/GetAllMessage";

export function useUserDraft(userId: string, key: string, initialValue = "") {
  const storageKey = `${key}-${userId}`;
  const [value, setValue] = useState<string>(initialValue);

  // Load value from localStorage on mount / user change
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      setValue(parsed.value || "");
    } else {
      setValue(initialValue);
    }
  }, [storageKey, initialValue]);

  // Save to localStorage whenever value changes
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ value }));
  }, [storageKey, value]);

  // Clear draft (e.g., after sending)
  const clear = () => {
    localStorage.removeItem(storageKey);
    setValue("");
  };

  return { value, setValue, clear };
}

// Ensures no duplicate messages by id
export const dedupeMessages = (messages: GetAllMessage[]): GetAllMessage[] => {
  const seen = new Set<string>();
  return messages.filter((m) => {
    if (!m?.id) return false; // skip invalid
    if (seen.has(m.id.toString())) return false;
    seen.add(m.id.toString());
    return true;
  });
};

