import { useState, useEffect } from "react";
import type { GetAllMessage } from "../dto/response/GetAllMessage";
import type { PrivateChatMessage } from "../dto/response/PrivateChatMessage";

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

// Helper: group messages by day
export const groupMessagesByDay = (messages: PrivateChatMessage[]) => {
  const groups = messages.reduce((groups: Record<string, PrivateChatMessage[]>, msg) => {
    const day = new Date(msg.created_at).toDateString();
    if (!groups[day]) groups[day] = [];
    groups[day].push(msg);
    return groups;
  }, {});

  // Sort messages inside each day: oldest → newest
  Object.keys(groups).forEach(day => {
    groups[day].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  });

  return groups;
};




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

export const filterMessages = (messages: PrivateChatMessage[]): PrivateChatMessage[] => {
  const seen = new Set<string>();
  return messages.filter((m) => {
    if (!m?.id) return false; // skip invalid
    if (seen.has(m.id.toString())) return false;
    seen.add(m.id.toString());
    return true;
  });
};


