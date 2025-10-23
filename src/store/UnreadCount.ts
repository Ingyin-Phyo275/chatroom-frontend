// import { create } from "zustand";

// interface CounterState {
//     value: number;
//     setValue: (newValue: number) => void;
// }

// const useCounterStore = create<CounterState>((set) => ({
//     value: 0,
//     setValue: (newValue: number) => set({ value: newValue }),
// }));

// export default useCounterStore;


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

import { create } from "zustand";

interface UserUnreadData {
  count: number;
  type: string;
}

interface UnreadCountStore {
  value: Record<string, UserUnreadData>;
  setValue: (userId: string, count: number, type: string) => void;
  getValue: (userId: string) => number;
  getType: (userId: string) => string | undefined;
}

const useCounterStore = create<UnreadCountStore>((set, get) => ({
  value: {},
  setValue: (userId, count, type) =>
    set((state) => ({
      value: {
        ...state.value,
        [userId]: { count, type },
      },
    })),
  getValue: (userId) => get().value[userId]?.count || 0,
  getType: (userId) => get().value[userId]?.type,
}));

export default useCounterStore;

