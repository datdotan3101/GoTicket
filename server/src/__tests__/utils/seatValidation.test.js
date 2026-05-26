import { describe, it, expect } from "vitest";
import { validateSeatSelection } from "../../utils/seatValidation.js";

const makeSeat = (id, row, seat) => ({ id, row_number: row, seat_number: seat });

describe("validateSeatSelection", () => {
  it("valid: 1 single seat", () => {
    const result = validateSeatSelection([makeSeat(1, 1, 5)]);
    expect(result.valid).toBe(true);
  });

  it("valid: multiple consecutive seats in the same row", () => {
    const seats = [makeSeat(1, 2, 3), makeSeat(2, 2, 4), makeSeat(3, 2, 5)];
    const result = validateSeatSelection(seats);
    expect(result.valid).toBe(true);
  });

  it("valid: seats in different rows (each row consecutive)", () => {
    const seats = [
      makeSeat(1, 1, 1), makeSeat(2, 1, 2),
      makeSeat(3, 2, 5)
    ];
    const result = validateSeatSelection(seats);
    expect(result.valid).toBe(true);
  });

  it("invalid: leaving an empty seat in the middle of a row", () => {
    const seats = [makeSeat(1, 1, 1), makeSeat(2, 1, 3)]; // skipped seat 2
    const result = validateSeatSelection(seats);
    expect(result.valid).toBe(false);
    expect(result.message).toContain("empty");
  });

  it("invalid: exceeds MAX_SEATS_PER_ORDER", () => {
    const seats = Array.from({ length: 11 }, (_, i) => makeSeat(i + 1, 1, i + 1));
    const result = validateSeatSelection(seats);
    expect(result.valid).toBe(false);
    expect(result.message).toContain("up to");
  });

  it("invalid: empty list", () => {
    const result = validateSeatSelection([]);
    expect(result.valid).toBe(false);
  });

  it("invalid: null input", () => {
    const result = validateSeatSelection(null);
    expect(result.valid).toBe(false);
  });

  it("valid: exactly maximum consecutive seats (MAX)", () => {
    const seats = Array.from({ length: 10 }, (_, i) => makeSeat(i + 1, 1, i + 1));
    const result = validateSeatSelection(seats);
    expect(result.valid).toBe(true);
  });
});
