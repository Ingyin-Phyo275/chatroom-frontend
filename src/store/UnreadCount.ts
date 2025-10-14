import { create } from "zustand";

interface CounterState {
    value: number;
    setValue: (newValue: number) => void;
}

const useCounterStore = create<CounterState>((set) => ({
    value: 0,
    setValue: (newValue: number) => set({ value: newValue }),
}));

export default useCounterStore;