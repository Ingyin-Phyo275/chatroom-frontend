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


import { create } from "zustand";

interface UnreadCountStore {
  value: Record<string, number>;
  setValue: (userId: string, count: number) => void;
  getValue: (userId: string) => number;
}

const useCounterStore = create<UnreadCountStore>((set, get) => ({
  value: {},
  setValue: (userId, count) =>
    set((state) => ({
      value: { ...state.value, [userId]: count },
    })),
  getValue: (userId) => get().value[userId] || 0,
}));

export default useCounterStore;
