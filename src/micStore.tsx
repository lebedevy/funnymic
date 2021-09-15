import create from 'zustand';
import { IMicResult } from './typing';

type IMicState = {
    currentMic: IMicResult | undefined;
    setCurrentMic: (m: IMicResult) => void;
    clearCurrentMic: () => void;
};

const useMicStore = create<IMicState>((set) => ({
    currentMic: undefined,
    setCurrentMic: (m: IMicResult) => set({ currentMic: m }),
    clearCurrentMic: () => set({ currentMic: undefined }),
}));

export default useMicStore;
