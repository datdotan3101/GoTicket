import { HOT_THRESHOLD } from '../constants/matchRules'

export const isMatchHot = (soldCount, totalSeats) =>
  totalSeats > 0 && soldCount / totalSeats > HOT_THRESHOLD

export const getSoldPercent = (soldCount, totalSeats) =>
  totalSeats > 0 ? Math.round((soldCount / totalSeats) * 100) : 0
