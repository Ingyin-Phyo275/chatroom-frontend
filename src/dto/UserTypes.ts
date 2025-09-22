// src/types.ts
export type ChatUserType = {
  id: string;
  username: string;
  status: string;
  tabs?: string;
  is_group?: boolean;
  avatar_url?: string
};
