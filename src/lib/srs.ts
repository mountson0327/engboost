// SM-2 spaced-repetition algorithm (the one Anki is based on).
// Pure & side-effect free so it is trivial to unit-test.

export type Grade = "again" | "hard" | "good" | "easy";

export type SrsState = {
  ease: number; // ease factor, >= 1.3
  intervalDays: number; // current interval in days
  reps: number; // number of consecutive successful reviews
  lapses: number; // number of times the card was forgotten
};

export type CardStateName = "new" | "learning" | "review" | "mastered";

export type SrsResult = SrsState & {
  dueDate: Date; // next time the card should be shown
  state: CardStateName;
};

// Map the four review buttons to SM-2 quality scores (0..5).
const QUALITY: Record<Grade, number> = {
  again: 1,
  hard: 3,
  good: 4,
  easy: 5,
};

const MIN_EASE = 1.3;
const DAY_MS = 24 * 60 * 60 * 1000;
const MASTERED_INTERVAL_DAYS = 21; // >= 3 weeks between reviews => "mastered"

function deriveState(reps: number, intervalDays: number): CardStateName {
  if (intervalDays >= MASTERED_INTERVAL_DAYS) return "mastered";
  // Interval has reached the "graduated" spacing (>= the 6-day step) => review.
  if (reps >= 2 && intervalDays >= 6) return "review";
  return "learning";
}

/**
 * Compute the next SRS state given the current state and the user's grade.
 * `now` is injectable so tests are deterministic.
 */
export function schedule(
  current: SrsState,
  grade: Grade,
  now: Date = new Date(),
): SrsResult {
  const quality = QUALITY[grade];
  let { ease, intervalDays, reps, lapses } = current;

  if (quality < 3) {
    // Failed: reset the streak, short relearning interval, count a lapse.
    reps = 0;
    lapses += 1;
    intervalDays = 1;
  } else {
    if (reps === 0) {
      intervalDays = 1;
    } else if (reps === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * ease);
    }
    // "hard" grows slower than the default schedule.
    if (grade === "hard") {
      intervalDays = Math.max(1, Math.round(intervalDays * 0.8));
    }
    reps += 1;
  }

  // Update ease factor per the SM-2 formula.
  ease = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ease < MIN_EASE) ease = MIN_EASE;

  const dueDate = new Date(now.getTime() + intervalDays * DAY_MS);

  return {
    ease: Number(ease.toFixed(2)),
    intervalDays,
    reps,
    lapses,
    dueDate,
    state: deriveState(reps, intervalDays),
  };
}
