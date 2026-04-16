import { create } from 'zustand'

export const useSeatStore = create((set) => ({
  selectedSeats: [],
  setSelectedSeats: (seatsOrUpdater) =>
    set((state) => ({
      selectedSeats:
        typeof seatsOrUpdater === 'function' ? seatsOrUpdater(state.selectedSeats) : seatsOrUpdater,
    })),
  toggleSeat: (seat) =>
    set((state) => {
      const exists = state.selectedSeats.some((item) => item.id === seat.id)
      return {
        selectedSeats: exists
          ? state.selectedSeats.filter((item) => item.id !== seat.id)
          : [...state.selectedSeats, seat],
      }
    }),
  clearSeats: () => set({ selectedSeats: [] }),
}))
