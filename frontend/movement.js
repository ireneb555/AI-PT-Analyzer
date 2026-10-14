export const CONFIG = {
  standingAngle: 160,
  bottomAngle: 105,
  goodDepth: 95,
  smoothing: 0.35,
  minVisibility: 0.5,
};

const LANDMARK = {
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
};

export function jointAngle(a, b, c) {
  const first = { x: a.x - b.x, y: a.y - b.y };
  const second = { x: c.x - b.x, y: c.y - b.y };
  const magnitude = Math.hypot(first.x, first.y) * Math.hypot(second.x, second.y);
  if (magnitude === 0) return null;

  const cosine = Math.min(1, Math.max(-1,
    (first.x * second.x + first.y * second.y) / magnitude));
  return Math.acos(cosine) * 180 / Math.PI;
}

export function pickSide(landmarks) {
  const visibility = (indices) =>
    indices.reduce((sum, index) => sum + (landmarks[index].visibility ?? 0), 0) / indices.length;

  const left = [LANDMARK.LEFT_HIP, LANDMARK.LEFT_KNEE, LANDMARK.LEFT_ANKLE];
  const right = [LANDMARK.RIGHT_HIP, LANDMARK.RIGHT_KNEE, LANDMARK.RIGHT_ANKLE];
  const leftVisibility = visibility(left);
  const rightVisibility = visibility(right);

  return leftVisibility >= rightVisibility
    ? { name: "left", indices: left, visibility: leftVisibility }
    : { name: "right", indices: right, visibility: rightVisibility };
}

export class RepCounter {
  constructor() {
    this.reset();
  }

  reset() {
    this.reps = 0;
    this.stage = "up";
    this.minAngle = 180;
    this.lastDepth = null;
  }

  update(angle) {
    if (this.stage === "up" && angle < CONFIG.standingAngle - 10) {
      this.stage = "down_going";
      this.minAngle = angle;
    }

    if (this.stage === "down_going") {
      this.minAngle = Math.min(this.minAngle, angle);
      if (angle <= CONFIG.bottomAngle) {
        this.stage = "bottom";
      } else if (angle >= CONFIG.standingAngle) {
        this.stage = "up";
        return "partial";
      }
    }

    if (this.stage === "bottom") {
      this.minAngle = Math.min(this.minAngle, angle);
      if (angle >= CONFIG.standingAngle) {
        this.stage = "up";
        this.reps += 1;
        this.lastDepth = this.minAngle;
        return this.minAngle <= CONFIG.goodDepth ? "rep_good" : "rep_ok";
      }
    }

    return null;
  }
}
