// import { create } from "zustand";

// interface UnreadCountStore {
//   value: Record<string, number>;
//   setValue: (userId: string, count: number) => void;
//   getValue: (userId: string) => number;
// }

// const useCounterStore = create<UnreadCountStore>((set, get) => ({
//   value: {},
//   setValue: (userId, count) =>
//     set((state) => ({
//       value: { ...state.value, [userId]: count },
//     })),
//   getValue: (userId) => get().value[userId] || 0,
// }));

// export default useCounterStore;

// import { create } from "zustand";

// interface UserUnreadData {
//   count: number;
//   type: string;
// }

// interface UnreadCountStore {
//   value: Record<string, UserUnreadData>;
//   setValue: (userId: string, count: number, type: string) => void;
//   getValue: (userId: string) => number;
//   getType: (userId: string) => string | undefined;
// }

// const useCounterStore = create<UnreadCountStore>((set, get) => ({
//   value: {},
//   setValue: (userId, count, type) =>
//     set((state) => ({
//       value: {
//         ...state.value,
//         [userId]: { count, type },
//       },
//     })),
//   getValue: (userId) => get().value[userId]?.count || 0,
//   getType: (userId) => get().value[userId]?.type,
// }));

// export default useCounterStore;

import { create } from "zustand";

interface UnreadCountStore {
  value: Record<string, { count: number; type: string }>;
  setValue: (userId: string | number, count: number, type: string) => void;
  getValue: (userId: string | number, type: string) => number;
  getType: (userId: string | number, type: string) => string | undefined;
}

const useCounterStore = create<UnreadCountStore>((set, get) => ({
  value: {},
  setValue: (userId, count, type) =>
    set((state) => ({
      value: {
        ...state.value,
        [`${type}-${userId}`]: { count, type },
      },
    })),
  getValue: (userId, type) => get().value[`${type}-${userId}`]?.count || 0,
  getType: (userId, type) => get().value[`${type}-${userId}`]?.type,
}));

export default useCounterStore;



