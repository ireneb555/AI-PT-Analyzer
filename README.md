# AI-Assisted Rehabilitation Exercise Tracker

## About

This project is being developed through i-MADE at UIUC. Our goal is to build a web application that uses computer vision and pose estimation to analyze rehabilitation exercises through a laptop webcam.

The application will use body landmarks to measure things like joint angles, range of motion, and repetitions and provide simple movement feedback.

For our initial prototype, we will focus on one or two rehabilitation exercises and expand from there.

## How It Works

Webcam → Pose Estimation → Body Landmarks → Movement Analysis → Feedback

We plan to use a pretrained pose-estimation model such as MediaPipe Pose to detect body landmarks. We can then use these landmarks to calculate movement measurements such as joint angles and range of motion.

## Tech Stack

- React / JavaScript
- MediaPipe Pose
- Python / NumPy (if needed)
- Git / GitHub

The tech stack may change as we develop and test the initial prototype.

## Initial Goals

- Get webcam input working
- Detect body landmarks using pose estimation
- Calculate joint angles and range of motion
- Support one rehabilitation exercise
- Detect and count repetitions
- Display simple movement feedback

## Team

Developed by a student team through i-MADE at the University of Illinois Urbana-Champaign.
