import { describe, it, expect } from "vitest";
import { generateStands } from "../../utils/standGenerator.js";

const defaultPrices = { A: 300000, B: 200000, C: 150000, D: 100000 };

describe("generateStands", () => {
  it("trả về 4 khán đài với tổng capacity xấp xỉ input", () => {
    const stands = generateStands(1000, defaultPrices);
    expect(stands).toHaveLength(4);
    const total = stands.reduce((s, st) => s + st.totalSeats, 0);
    // Sai số cho phép ±10% do tính toán rows * seatsPerRow
    expect(total).toBeGreaterThan(900);
    expect(total).toBeLessThan(1100);
  });

  it("mỗi stand có name đúng (A, B, C, D)", () => {
    const stands = generateStands(1000, defaultPrices);
    expect(stands.map((s) => s.name)).toEqual(["A", "B", "C", "D"]);
  });

  it("giá được gán đúng cho từng stand", () => {
    const stands = generateStands(500, defaultPrices);
    const standA = stands.find((s) => s.name === "A");
    const standD = stands.find((s) => s.name === "D");
    expect(standA?.price).toBe(300000);
    expect(standD?.price).toBe(100000);
  });

  it("totalSeats = rows * seatsPerRow cho mỗi stand", () => {
    const stands = generateStands(800, defaultPrices);
    for (const stand of stands) {
      expect(stand.totalSeats).toBe(stand.rows * stand.seatsPerRow);
    }
  });

  it("xử lý capacity nhỏ (100 — minimum)", () => {
    const stands = generateStands(100, defaultPrices);
    expect(stands).toHaveLength(4);
    stands.forEach((s) => {
      expect(s.rows).toBeGreaterThan(0);
      expect(s.seatsPerRow).toBeGreaterThan(0);
    });
  });

  it("xử lý giá 0 cho tất cả stands", () => {
    const zeroPrices = { A: 0, B: 0, C: 0, D: 0 };
    const stands = generateStands(1000, zeroPrices);
    stands.forEach((s) => expect(s.price).toBe(0));
  });
});
