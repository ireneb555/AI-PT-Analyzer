# Known Issues & Test Notes

Testing of the squat tracker prototype (`frontend/`), October 2026.
Owners below follow the "Tasks For Next Week" assignments: rep counting goes to Krishna, tracking stability to Akshay, and React/UI to Irene.

## Summary

| # | Issue | Area | Owner | Found by |
| --- | --- | --- | --- | --- |
| 1 | Fast squats aren't counted, or are graded too shallow | Thresholds / smoothing | Krishna | Simulation |
| 2 | Small knee wobble shows "That rep didn't count" | Rep counting | Krishna | Simulation |
| 3 | Rep counted when starting seated or crouched | Rep counting | Krishna | Simulation |
| 4 | Squats of about 110° never count | Thresholds | Krishna | Simulation |
| 5 | Tracked leg can flip between frames | Tracking | Akshay | Code review, needs webcam test |
| 6 | Facing the camera, the app still reports only one leg ("left"/"right") | Tracking / camera position | Akshay | Manual test (phone) |
| 7 | Warning messages stick after the problem is fixed | UI | Irene | Code review |
| 8 | Skeleton overlay misaligned on non-4:3 cameras | UI | Irene | Code review, needs webcam test |
| 9 | No way to stop the camera | UI | Irene | Code review |
| 10 | "Reset reps" doesn't clear the feedback message | UI | Irene | Code review |
| 11 | Needs internet and a GPU, with an unclear error otherwise | Setup | Akshay | Code review |
| 12 | Blocked camera or slow model download looks like a broken camera | UI | Irene | Manual test (Caroline's laptop) |

## How it was tested

| Area | Method | Result |
| --- | --- | --- |
| Install / build | `npm install`, `npm run build` (Node 24, npm 11) | Passes |
| Dev server | `npm run dev`, loaded `/`, `/src/main.jsx`, `/src/App.jsx` | Serves correctly |
| Remote assets | Fetched the MediaPipe WASM (jsDelivr) and `pose_landmarker_lite.task` (Google Storage) | Both reachable |
| Angle math | `jointAngle` on straight, 90°, and degenerate inputs | Correct (180°, 90°, `null`) |
| Depth × speed | Simulated knee-angle curves fed through the app's smoothing and `RepCounter` at 30 and 15 fps | See bugs 1 and 4 |
| Live webcam | Manual testing, see the checklist at the bottom | **In progress** |

The simulation doesn't use a camera. It generates the knee angle a perfect tracker would report and runs it through the same smoothing (`CONFIG.smoothing`) and `RepCounter` the app uses. This isolates the counting logic from MediaPipe noise.

### Depth × speed results (simulated)

"Duration" is the time for one full down-and-up squat. ✅ = counted as "Good rep", 🟡 = counted as "go deeper", ❌ = not counted.

| True depth | 3 s | 1.5 s | 0.8 s | 0.5 s |
| --- | --- | --- | --- | --- |
| **30 fps** | | | | |
| 90° | ✅ | ✅ | ✅ | 🟡 |
| 100° | 🟡 | 🟡 | 🟡 | ❌ |
| 110° | ❌ | ❌ | ❌ | ❌ |
| **15 fps** (slower laptop) | | | | |
| 90° | ✅ | ✅ | 🟡 | ❌ |
| 100° | 🟡 | 🟡 | ❌ | ❌ |
| 110° | ❌ | ❌ | ❌ | ❌ |

Five deep 1-second squats in a row with no pause counted correctly (5/5).

## Bugs

### 1. Fast squats aren't counted, or are graded too shallow
**Where:** `src/App.jsx` (smoothing), `movement.js` (`CONFIG`)
The knee angle is smoothed with `smoothed += 0.35 × (raw − smoothed)` once per frame, which flattens the bottom of a quick squat. A 90° squat done in 0.5 s reads as about 98° at 30 fps and about 109° at 15 fps. It's then graded "go deeper" or not counted at all.
Because smoothing happens per frame instead of per unit of time, **the same squat scores differently on slower computers**.

### 2. Small knee wobble shows "That rep didn't count"
**Where:** `movement.js`, `RepCounter.update`
**Steps:** While standing, bend your knee slightly (just under 150°) and straighten.
**Expected:** Nothing, because no squat was attempted.
**Actual:** "You stood up before reaching depth. That rep didn't count." The "started squatting" (150°) and "standing" (160°) thresholds are only 10° apart, so normal sway crosses them.

### 3. Rep counted when starting seated or crouched
**Where:** `movement.js`, `RepCounter.update`
**Steps:** Click **Start camera** while sitting or crouched, then stand up.
**Expected:** No rep.
**Actual:** 1 rep, "Good rep". The counter always starts in the `up` stage, so a first reading of 90° goes straight to `bottom`.

### 4. Squats of about 110° never count
**Where:** `movement.js`, `CONFIG.bottomAngle = 105`
A rep only counts once the knee bends past 105°. Rehab users may not be able to squat that deep, so a controlled partial squat always gets "didn't count". This is a threshold question as much as a bug. It's worth deciding the target range with the PT/biomechanics mentor, and possibly making it adjustable.

### 5. Tracked leg can flip between frames (needs webcam confirmation)
**Where:** `movement.js`, `pickSide`
`pickSide` re-picks the more visible leg on every frame, with no hysteresis. When both legs are similarly visible, the side can flip mid-rep. The smoothed angle then mixes two different legs, and the "Tracking side" label flickers. (This matches Akshay's task: "prevent the tracker from switching between left and right legs.")

### 6. Facing the camera, the app still reports only one leg
**Found:** manual test on a phone (front camera).
**Steps:** Face the camera head-on and do squats.
**Expected:** Either a "front view" mode that uses both legs, or a prompt to turn side-on.
**Actual:** Reps **were counted correctly**. Code review had predicted they wouldn't be, but in practice it worked. However, "Tracking side" still shows "left" or "right", because `pickSide` always picks the single most visible leg and has no front-view case. Only one knee is measured, so a problem in the other leg would go unnoticed.
**Still to check:** whether the side stays fixed or flips during head-on reps (see bug 5), and whether the reported depth matches the side-on depth for the same squat.

### 7. Warning messages stick after the problem is fixed
**Where:** `src/App.jsx`, `processFrame`
**Steps:** Start the camera, step out of frame, step back in.
**Actual:** "No person detected" or "Can't see your leg clearly" stays on screen until the next rep, even though tracking has resumed.

### 8. Skeleton overlay misaligned on non-4:3 cameras (needs webcam confirmation)
**Where:** `style.css`
The video uses `object-fit: cover` (cropped), but the canvas is stretched. If the webcam returns 16:9 instead of the requested 640×480, the drawn skeleton won't line up with the body.

### 9. No way to stop the camera
After you click start, the button stays disabled as "Camera on", and the webcam stays on until you close the tab.

### 10. "Reset reps" doesn't clear the feedback message
The counter resets, but the old message (for example, "Good rep") stays.

### 11. Needs internet and a GPU, with an unclear error otherwise
The WASM runtime and the model are downloaded from CDNs on every start, and the model uses `delegate: "GPU"` with no CPU fallback. If either fails, the only message is "Check camera permission and your connection".

### 12. Blocked camera or slow model download looks like a broken camera
**Found:** manual test on a Windows laptop.
**Steps:** With the laptop camera blocked (privacy shutter, camera off key, or Windows privacy setting), click **Start camera**.
**Actual:** The video shows the system's crossed-out camera image, while the app says "Running." and "No person detected". Nothing tells the user that the camera itself is blocked.
**Related:** The camera only starts *after* the ~6 MB pose model finishes downloading. On a slow network, the video area stays black with just "Loading..." for a long time. Starting the camera first, or showing download progress, would make this clearer.

## Manual webcam checklist

Fill in as tested. Record the browser, device, and lighting for each session.

**Test setups**
- **Phone:** the app opened in the phone browser over HTTPS from the laptop dev server, using the front camera. The laptop's built-in camera was blocked at the time (see bug 12).

| Scenario | Expected | Result |
| --- | --- | --- |
| Side-on: "Tracking side" matches the leg nearest the camera | Correct side | ✅ Phone: correct |
| Facing the camera: reps counted | ? (bug 6) | ✅ Phone: counted correctly, but shows one side only |
| Side-on, deep slow squat (~3 s) | Good rep | |
| Side-on, parallel squat (~100°) | Rep, "go deeper" | |
| Side-on, shallow squat (~120°) | Not counted | |
| Side-on, fast squats (< 1 s) | Counted (bug 1) | |
| 10 reps in a row, normal pace | 10 reps | |
| Camera at 45° | ? | |
| Camera low (on desk) vs. eye level | ? | |
| Too close (ankles out of frame) | "Can't see your leg" | |
| Walk out of frame and back in | Message clears (bug 7) | |
| Start the camera while seated, stand up | No rep (bug 3) | |
| "Tracking side" stays stable during reps | Stable (bug 5) | |
| Skeleton lines up with body | Aligned (bug 8) | |
| Deny camera permission, then "Try again" | Clear error, recovers | |
| `landmarks[i].visibility` is populated (check in console) | Values 0–1 | |
| Chrome / Edge / Firefox / Safari | Works | |
