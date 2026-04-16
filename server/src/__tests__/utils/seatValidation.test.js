import { describe, it, expect } from "vitest";
import { validateSeatSelection } from "../../utils/seatValidation.js";

const makeSeat = (id, row, seat) => ({ id, row_number: row, seat_number: seat });

describe("validateSeatSelection", () => {
  it("hợp lệ: 1 ghế đơn lẻ", () => {
    const result = validateSeatSelection([makeSeat(1, 1, 5)]);
    expect(result.valid).toBe(true);
  });

  it("hợp lệ: nhiều ghế liên tiếp cùng hàng", () => {
    const seats = [makeSeat(1, 2, 3), makeSeat(2, 2, 4), makeSeat(3, 2, 5)];
    const result = validateSeatSelection(seats);
    expect(result.valid).toBe(true);
  });

  it("hợp lệ: ghế ở nhiều hàng khác nhau (mỗi hàng liên tiếp)", () => {
    const seats = [
      makeSeat(1, 1, 1), makeSeat(2, 1, 2),
      makeSeat(3, 2, 5)
    ];
    const result = validateSeatSelection(seats);
    expect(result.valid).toBe(true);
  });

  it("không hợp lệ: bỏ trống ghế giữa hàng", () => {
    const seats = [makeSeat(1, 1, 1), makeSeat(2, 1, 3)]; // bỏ seat 2
    const result = validateSeatSelection(seats);
    expect(result.valid).toBe(false);
    expect(result.message).toContain("trống");
  });

  it("không hợp lệ: vượt quá MAX_SEATS_PER_ORDER (6)", () => {
    const seats = Array.from({ length: 7 }, (_, i) => makeSeat(i + 1, 1, i + 1));
    const result = validateSeatSelection(seats);
    expect(result.valid).toBe(false);
    expect(result.message).toContain("tối đa");
  });

  it("không hợp lệ: danh sách rỗng", () => {
    const result = validateSeatSelection([]);
    expect(result.valid).toBe(false);
  });

  it("không hợp lệ: null input", () => {
    const result = validateSeatSelection(null);
    expect(result.valid).toBe(false);
  });

  it("hợp lệ: chính xác 6 ghế liên tiếp (MAX)", () => {
    const seats = Array.from({ length: 6 }, (_, i) => makeSeat(i + 1, 1, i + 1));
    const result = validateSeatSelection(seats);
    expect(result.valid).toBe(true);
  });
});
