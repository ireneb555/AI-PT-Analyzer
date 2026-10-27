# Known Issues & Test Notes

Testing of the squat tracker prototype (`frontend/`), October 2026.

## What was tested

| Area | Method | Result |
| --- | --- | --- |
| Install / build | `npm install`, `npm run build` (Node 24, npm 11) | Passes |
| Dev server | `npm run dev`, loaded `/`, `/src/main.jsx`, `/src/App.jsx` | Serves correctly |
| Remote assets | Fetched MediaPipe WASM (jsDelivr) and `pose_landmarker_lite.task` (Google Storage) | Both reachable |
| Rep counting | Fed simulated knee-angle sequences into `RepCounter` | See bugs 2 and 3 |
| Angle math | `jointAngle` on straight, 90°, and degenerate inputs | Correct (180°, 90°, `null`) |
| Live webcam tracking | Manual, see checklist below | **Not yet done** |

## Bugs

### 1. Warning messages stick after the problem is fixed
**Where:** `src/App.jsx`, `processFrame`
**Steps:** Start the camera, step out of frame, step back in.
**Expected:** The "No person detected" or "Can't see your leg" message clears once you're tracked again.
**Actual:** The message stays on screen until the next rep event, even though the angle is updating again. A non-rep frame never resets feedback.

### 2. Small wobble shows a "didn't count" message
**Where:** `movement.js`, `RepCounter.update`
**Steps:** While standing, bend your knee slightly (angle drops just under 150°) and straighten.
**Expected:** Nothing, because no squat was attempted.
**Actual:** "You stood up before reaching depth. That rep didn't count." A dip of 175° → 148° → 175° triggers a `partial` event. The gap between "starting to squat" (150°) and "standing" (160°) is only 10°, so normal sway can cross it.

### 3. A rep is counted without squatting down
**Where:** `movement.js`, `RepCounter.update`
**Steps:** Start the camera while sitting or crouched, then stand up.
**Expected:** No rep, because there was no descent.
**Actual:** 1 rep, marked "Good rep". The counter starts in the `up` stage no matter what the first angle is, so a first reading of 90° goes straight to `bottom`.

### 4. Tracked leg can flip between frames (needs live confirmation)
**Where:** `movement.js`, `pickSide`; `src/App.jsx`
`pickSide` picks whichever leg has higher visibility on every frame, with no hysteresis. When both legs are similarly visible (for example, facing the camera), the side can flip back and forth. The smoothed angle then mixes values from two different legs, and the "Tracking side" label flickers.

### 5. Skeleton overlay misaligned on non-4:3 cameras (needs live confirmation)
**Where:** `style.css`
The video uses `object-fit: cover`, which crops it, but the canvas is stretched to the box. If the webcam ignores the 640×480 request and returns 16:9 (common on laptops), the drawn skeleton won't line up with the body.

### 6. No way to stop the camera
After starting, the button stays disabled as "Camera on", and the webcam light stays on until the tab is closed.

### 7. "Reset reps" doesn't clear the feedback message
The rep count resets, but the old message (for example, "Good rep") stays.

### 8. Needs internet and a GPU, with an unclear error otherwise
The WASM runtime and the model are downloaded from CDNs on every start, and the model is created with `delegate: "GPU"` with no CPU fallback. Offline, or on a machine where the WebGL GPU delegate fails, the user sees only "Unable to start. Check camera permission and your connection", which doesn't tell them the real cause.

### 9. React state updated every frame (performance)
`processFrame` calls up to six `setState`s per animation frame, and it runs detection even when the video hasn't produced a new frame. This works, but it causes extra re-renders and may lag on slower laptops.

## To verify in a real browser

- [ ] `landmarks[i].visibility` is actually populated by `@mediapipe/tasks-vision` 0.10.14. If it's missing, `pickSide` treats it as 0 and the app will always say "Can't see your leg".
- [ ] Camera permission denied shows a helpful error, and "Try again" works after permission is granted.
- [ ] Skeleton lines up with the body (bug 5).
- [ ] Side-on deep squats count as "Good rep"; shallower ones count as "go a bit deeper".
- [ ] Tracking-side label is stable when side-on (bug 4).
- [ ] Behavior after switching tabs and coming back.
- [ ] Browsers: Chrome, Edge, Firefox, Safari.
