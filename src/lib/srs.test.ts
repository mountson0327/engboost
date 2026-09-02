import { describe, it, expect } from "vitest";
import { schedule, type SrsState } from "./srs";

const fresh: SrsState = { ease: 2.5, intervalDays: 0, reps: 0, lapses: 0 };
const NOW = new Date("2026-01-01T00:00:00Z");

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

describe("schedule (SM-2)", () => {
  it("first 'good' review schedules 1 day out and enters learning", () => {
    const r = schedule(fresh, "good", NOW);
    expect(r.reps).toBe(1);
    expect(r.intervalDays).toBe(1);
    expect(daysBetween(NOW, r.dueDate)).toBe(1);
    expect(r.state).toBe("learning");
  });

  it("second 'good' review schedules 6 days out", () => {
    const first = schedule(fresh, "good", NOW);
    const second = schedule(first, "good", NOW);
    expect(second.reps).toBe(2);
    expect(second.intervalDays).toBe(6);
    expect(second.state).toBe("review");
  });

  it("third 'good' review multiplies interval by ease", () => {
    const s: SrsState = fresh;
    const a = schedule(s, "good", NOW); // 1
    const b = schedule(a, "good", NOW); // 6
    const c = schedule(b, "good", NOW); // 6 * ease
    expect(c.intervalDays).toBe(Math.round(6 * b.ease));
  });

  it("'again' resets reps, adds a lapse, and shortens interval", () => {
    const learned = schedule(schedule(fresh, "good", NOW), "good", NOW);
    const failed = schedule(learned, "again", NOW);
    expect(failed.reps).toBe(0);
    expect(failed.lapses).toBe(1);
    expect(failed.intervalDays).toBe(1);
    expect(failed.ease).toBeLessThan(learned.ease);
  });

  it("ease never drops below 1.3", () => {
    let s: SrsState = { ...fresh, ease: 1.3 };
    for (let i = 0; i < 10; i++) s = schedule(s, "again", NOW);
    expect(s.ease).toBeGreaterThanOrEqual(1.3);
  });

  it("long intervals mark the card mastered", () => {
    const s: SrsState = { ease: 2.5, intervalDays: 20, reps: 5, lapses: 0 };
    const r = schedule(s, "easy", NOW);
    expect(r.intervalDays).toBeGreaterThanOrEqual(21);
    expect(r.state).toBe("mastered");
  });

  it("'hard' grows slower than 'good'", () => {
    const base = schedule(schedule(fresh, "good", NOW), "good", NOW);
    const good = schedule(base, "good", NOW);
    const hard = schedule(base, "hard", NOW);
    expect(hard.intervalDays).toBeLessThan(good.intervalDays);
  });
});
