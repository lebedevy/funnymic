import create from 'zustand';

export type IUser = { email: string; first: string; last: string; id: number };

type IUserState = {
    user: IUser | undefined;
    login: (u: IUser) => void;
    logout: () => void;
};

const useUserStore = create<IUserState>((set) => ({
    user: undefined,
    login: (user: IUser) => set({ user }),
    logout: () => set({ user: undefined }),
}));

export default useUserStore;
