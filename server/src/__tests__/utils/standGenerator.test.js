import { describe, it, expect } from "vitest";
import { generateStands } from "../../utils/standGenerator.js";

const mockBlockConfigs = {
  A: { active: true, capacity: 250, price: 300000 },
  B: { active: true, capacity: 250, price: 200000 },
  C: { active: true, capacity: 250, price: 150000 },
  D: { active: true, capacity: 250, price: 100000 },
};

describe("generateStands", () => {
  it("returns 4 stands with total capacity approximately equal to input", () => {
    const stands = generateStands(mockBlockConfigs);
    expect(stands).toHaveLength(4);
    const total = stands.reduce((s, st) => s + st.totalSeats, 0);
    // Allowance of ±10% due to rows * seatsPerRow calculation
    expect(total).toBeGreaterThan(900);
    expect(total).toBeLessThan(1100);
  });

  it("each stand has the correct name (A, B, C, D)", () => {
    const stands = generateStands(mockBlockConfigs);
    expect(stands.map((s) => s.name)).toEqual(["A", "B", "C", "D"]);
  });

  it("price is assigned correctly for each stand", () => {
    const stands = generateStands(mockBlockConfigs);
    const standA = stands.find((s) => s.name === "A");
    const standD = stands.find((s) => s.name === "D");
    expect(standA?.price).toBe(300000);
    expect(standD?.price).toBe(100000);
  });

  it("totalSeats = rows * seatsPerRow for each stand", () => {
    const stands = generateStands(mockBlockConfigs);
    for (const stand of stands) {
      expect(stand.totalSeats).toBe(stand.rows * stand.seatsPerRow);
    }
  });

  it("handles small capacity (100 — minimum)", () => {
    const smallConfigs = {
      A: { active: true, capacity: 25, price: 300000 },
      B: { active: true, capacity: 25, price: 200000 },
      C: { active: true, capacity: 25, price: 150000 },
      D: { active: true, capacity: 25, price: 100000 },
    };
    const stands = generateStands(smallConfigs);
    expect(stands).toHaveLength(4);
    stands.forEach((s) => {
      expect(s.rows).toBeGreaterThan(0);
      expect(s.seatsPerRow).toBeGreaterThan(0);
    });
  });

  it("handles price of 0 for all stands", () => {
    const zeroPrices = {
      A: { active: true, capacity: 250, price: 0 },
      B: { active: true, capacity: 250, price: 0 },
      C: { active: true, capacity: 250, price: 0 },
      D: { active: true, capacity: 250, price: 0 },
    };
    const stands = generateStands(zeroPrices);
    stands.forEach((s) => expect(s.price).toBe(0));
  });
});
