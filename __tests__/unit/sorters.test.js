import { sortBadges, sortRewards } from "../../utils/sorters";

describe("sortBadges()", () => {
  const badges = [
    { id: "b1", achieved: false },
    { id: "b2", achieved: true },
    { id: "b3", achieved: false },
  ];

  test("returns same reference for Default mode (0)", () => {
    const result = sortBadges(badges, 0);
    expect(result).toBe(badges);
  });

  test("sorts unlocked badges first when mode=1", () => {
    const result = sortBadges(badges, 1);
    expect(result.map(b => b.id)).toEqual(["b2", "b1", "b3"]);
  });

  test("sorts locked badges first when mode=2", () => {
    const result = sortBadges(badges, 2);
    expect(result.map(b => b.id)).toEqual(["b1", "b3", "b2"]);
  });
});

describe("sortRewards()", () => {
  const rewards = [
    { id: "r1", points: 500 },
    { id: "r2", points: 100 },
    { id: "r3", points: 2000 },
    { id: "r4" }, // missing points (defaults to 0)
  ];

  test("returns same reference for Default mode (0)", () => {
    const result = sortRewards(rewards, 0);
    expect(result).toBe(rewards);
  });

  test("sorts rewards ascending by points when mode=1", () => {
    const result = sortRewards(rewards, 1);
    expect(result.map(r => r.id)).toEqual(["r4", "r2", "r1", "r3"]);
  });

  test("sorts rewards descending by points when mode=2", () => {
    const result = sortRewards(rewards, 2);
    expect(result.map(r => r.id)).toEqual(["r3", "r1", "r2", "r4"]);
  });
});
