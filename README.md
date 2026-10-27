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

- [Node.js](https://nodejs.org/) 20 or newer (includes npm). Check with `node -v`.
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

Open the URL Vite prints (usually http://localhost:5173), click **Start camera**, and allow camera access.

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

## Contributing

Work on your own branch and open a pull request into `main`. Don't push directly to `main`.

```bash
git checkout -b your-name/short-description
# ...make changes...
git push -u origin your-name/short-description
```

Known bugs are tracked in [docs/known-issues.md](docs/known-issues.md).

## Initial Goals

- Get webcam input working
- Detect body landmarks using pose estimation
- Calculate joint angles and range of motion
- Support one rehabilitation exercise
- Detect and count repetitions
- Display simple movement feedback

## Team

Developed by a student team through i-MADE at the University of Illinois Urbana-Champaign.
