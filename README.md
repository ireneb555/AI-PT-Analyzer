# AI-Assisted Rehabilitation Exercise Tracker

## About

This project is being developed through i-MADE at UIUC. Our goal is to build a web application that uses computer vision and pose estimation to analyze rehabilitation exercises through a laptop webcam.

The application will use body landmarks to measure things like joint angles, range of motion, and repetitions and provide simple movement feedback.

For our initial prototype, we will focus on one or two rehabilitation exercises and expand from there.

## How It Works

Webcam → Pose Estimation → Body Landmarks → Movement Analysis → Feedback

We plan to use a pretrained pose-estimation model such as MediaPipe Pose to detect body landmarks. We can then use these landmarks to calculate movement measurements such as joint angles and range of motion.

## Current Prototype

The current prototype is a **squat tracker**. It finds the hip, knee, and ankle of whichever leg is most visible, measures the knee angle, counts reps, and gives depth feedback. It runs entirely in the browser. Video never leaves your computer.

## Setup

### Prerequisites

- [VS Code](https://code.visualstudio.com/) and [Git](https://git-scm.com/).
- [Node.js](https://nodejs.org/), LTS version (includes npm). Check with `node -v`.
- A webcam.
- A recent Chrome or Edge browser (other browsers are untested so far).
- An internet connection. The pose model and runtime are downloaded when you click **Start camera**.

### Install and run

```bash
git clone https://github.com/ireneb555/AI-PT-Analyzer.git
cd AI-PT-Analyzer/frontend
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173), click **Start camera**, and allow camera access. Press `Ctrl + C` in the terminal to stop the server.

You only need `npm install` the first time, or when dependencies change. After that, `npm run dev` is enough.

### Using the squat tracker

1. Stand **side-on** to the camera, a few steps back, so your hip, knee, and ankle are all in frame.
2. Squat down and stand back up. A rep counts once your knee bends past about 105° and you stand back up past about 160°. Reaching about 95° or lower counts as full depth.
3. Use **Reset reps** to start over.

These thresholds live in `CONFIG` in `frontend/movement.js`.

### Other commands (run in `frontend/`)

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Build a production version into `frontend/dist/` |
| `npm run preview` | Serve the production build locally |

### Troubleshooting

- **"Camera access is unavailable"**: the page must be opened on `localhost` or over HTTPS. Browsers block the camera on plain `http://` network addresses.
- **"Unable to start..."**: check that camera permission is allowed (the camera icon in the address bar), that no other app (Zoom, Teams) is using the camera, and that you're online.
- **Video shows a crossed-out camera icon (status says "Running.")**: the camera is blocked by the laptop, not the app. Open the physical privacy shutter, press the camera on/off key (usually on the F-key row), or check Windows Settings → Privacy & security → Camera. Test with the Windows Camera app. If that works, pick the right webcam from the camera icon in the browser's address bar.
- **Camera stays black for a while after clicking Start**: the pose model (~6 MB) downloads before the camera turns on. Wait, or try a faster network.
- **"Can't see your leg clearly"**: step back or improve lighting so your whole leg is visible.
- **`npm` not found**: install Node.js and reopen your terminal.

## Project Structure

```
frontend/
├── index.html      # Page shell
├── style.css       # Styles
├── movement.js     # Angle math, side selection, rep counter (no React)
└── src/
    ├── main.jsx    # React entry point
    └── App.jsx     # Webcam, MediaPipe pose detection, UI
docs/
└── known-issues.md # Bugs found during testing and manual test checklist
```

## Tech Stack

- React 19 + Vite
- MediaPipe Tasks Vision (Pose Landmarker, lite model)
- Python / NumPy (if needed later)
- Git / GitHub

The tech stack may change as we develop and test the initial prototype.

## Known Issues

Main issues found in testing so far. Full details, simulated test results, and the manual test checklist are in [docs/known-issues.md](docs/known-issues.md).

- Fast squats (under about 1 s) may not count or get graded too shallow, especially on slower computers.
- Squats shallower than about 105° never count.
- A small knee wobble can show "That rep didn't count".
- Starting the camera while seated and then standing counts a rep.
- The tracked leg can switch between left and right mid-rep, for example when facing the camera and rotating slightly.
- Facing the camera still counts reps, but only one leg is measured (it shows "left" or "right", not both).
- Warning messages don't clear after you step back into frame.
- There's no button to stop the camera.

## Contributing

Work on your own branch and open a pull request into `main`. Please don't push directly to `main` or force-push.

```bash
git switch main
git pull origin main            # get the latest code
git switch -c yourname-task     # create your branch
# ...make changes and check the app still runs...
git add .
git commit -m "Describe your change"
git push -u origin yourname-task
```

Then open the repository on GitHub, click **Compare & pull request**, describe your changes, and request a review. If Git shows an error or merge conflict, share a screenshot in Discord before running anything that could overwrite changes.

## Initial Goals

- Get webcam input working
- Detect body landmarks using pose estimation
- Calculate joint angles and range of motion
- Support one rehabilitation exercise
- Detect and count repetitions
- Display simple movement feedback

## Team

Developed by a student team through i-MADE at the University of Illinois Urbana-Champaign.
