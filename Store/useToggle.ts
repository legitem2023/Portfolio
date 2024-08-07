import create from 'zustand';

interface ToggleState {
  isToggled: boolean;
  toggle: () => void;
}

const useToggle = create<ToggleState>((set) => ({
  isToggled: false,
  toggle: () => set((state) => ({ isToggled: !state.isToggled })),
}));

export default useToggle;
