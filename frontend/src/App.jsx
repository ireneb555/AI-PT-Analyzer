import { DrawingUtils, FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { CONFIG, jointAngle, pickSide, RepCounter } from "../movement.js";

const INITIAL_FEEDBACK = "Stand side-on to the camera so your whole body is visible.";

export default function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const landmarkerRef = useRef(null);
  const drawingRef = useRef(null);
  const counterRef = useRef(new RepCounter());
  const smoothedAngleRef = useRef(null);
  const runningRef = useRef(false);
  const disposedRef = useRef(false);
  const animationFrameRef = useRef(null);

  const [angle, setAngle] = useState(null);
  const [reps, setReps] = useState(0);
  const [depth, setDepth] = useState(null);
  const [side, setSide] = useState(null);
  const [feedback, setFeedback] = useState({ message: INITIAL_FEEDBACK, kind: "" });
  const [status, setStatus] = useState("Not started.");
  const [phase, setPhase] = useState("idle");

  const stopCamera = useCallback(() => {
    const video = videoRef.current;
    const stream = video?.srcObject;
    if (stream instanceof MediaStream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (video) video.srcObject = null;
  }, []);

  useEffect(() => {
    disposedRef.current = false;
    return () => {
      disposedRef.current = true;
      runningRef.current = false;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      stopCamera();
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
    };
  }, [stopCamera]);

  const loadModel = useCallback(async () => {
    setStatus("Loading pose model...");
    const files = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm",
    );
    const landmarker = await PoseLandmarker.createFromOptions(files, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numPoses: 1,
    });

    if (disposedRef.current) {
      landmarker.close();
      return;
    }

    landmarkerRef.current = landmarker;
    drawingRef.current = new DrawingUtils(canvasRef.current.getContext("2d"));
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Camera access is unavailable. Open this page on localhost or over HTTPS in a supported browser.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 },
      audio: false,
    });

    if (disposedRef.current) {
      stream.getTracks().forEach((track) => track.stop());
      return false;
    }

    const video = videoRef.current;
    try {
      video.srcObject = stream;
      await video.play();
      canvasRef.current.width = video.videoWidth;
      canvasRef.current.height = video.videoHeight;
      return true;
    } catch (error) {
      stream.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
      throw error;
    }
  }, []);

  const processFrame = useCallback(() => {
    if (!runningRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    try {
      const result = landmarkerRef.current.detectForVideo(video, performance.now());
      context.clearRect(0, 0, canvas.width, canvas.height);
      const landmarks = result.landmarks?.[0];

      if (!landmarks) {
        setFeedback({
          message: "No person detected. Make sure your full body is in frame.",
          kind: "warning",
        });
      } else {
        drawingRef.current.drawLandmarks(landmarks, { radius: 3, color: "#4fd1a5" });
        drawingRef.current.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, {
          color: "#ffffff88",
          lineWidth: 2,
        });

        const trackedSide = pickSide(landmarks);
        if (trackedSide.visibility < CONFIG.minVisibility) {
          setFeedback({
            message: "Can't see your leg clearly. Step back so your hip to ankle is in frame.",
            kind: "warning",
          });
        } else {
          const [hip, knee, ankle] = trackedSide.indices.map((index) => ({
            x: landmarks[index].x * canvas.width,
            y: landmarks[index].y * canvas.height,
          }));
          const rawAngle = jointAngle(hip, knee, ankle);

          if (rawAngle !== null) {
            setFeedback((current) =>
              current.kind === "warning" ? { message: "", kind: "" } : current);
            const smoothedAngle = smoothedAngleRef.current === null
              ? rawAngle
              : smoothedAngleRef.current + CONFIG.smoothing * (rawAngle - smoothedAngleRef.current);
            smoothedAngleRef.current = smoothedAngle;
            setAngle(Math.round(smoothedAngle));
            setSide(trackedSide.name);

            const event = counterRef.current.update(smoothedAngle);
            setReps(counterRef.current.reps);
            if (counterRef.current.lastDepth !== null) {
              setDepth(Math.round(counterRef.current.lastDepth));
            }

            if (event === "rep_good") {
              setFeedback({ message: "Good rep. Full depth reached.", kind: "good" });
            } else if (event === "rep_ok") {
              setFeedback({ message: "Rep counted, but go a bit deeper next time.", kind: "" });
            } else if (event === "partial") {
              setFeedback({ message: "You stood up before reaching depth. That rep didn't count.", kind: "" });
            }
          }
        }
      }
    } catch (error) {
      console.error("Pose tracking failed:", error);
      runningRef.current = false;
      stopCamera();
      setPhase("error");
      setStatus("Pose tracking stopped because of an error.");
      setFeedback({ message: `Pose tracking error: ${error.message}`, kind: "error" });
      return;
    }

    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [stopCamera]);

  async function handleStart() {
    setPhase("loading");
    setFeedback({ message: "", kind: "" });

    try {
      if (!landmarkerRef.current) await loadModel();
      if (disposedRef.current || !await startCamera()) return;

      runningRef.current = true;
      setPhase("running");
      setStatus("Running.");
      setFeedback({ message: "Ready. Do a squat.", kind: "good" });
      animationFrameRef.current = requestAnimationFrame(processFrame);
    } catch (error) {
      console.error("Unable to start squat tracking:", error);
      stopCamera();
      setPhase("error");
      setStatus(`Error: ${error.message}`);
      setFeedback({
        message: "Unable to start. Check camera permission and your connection, then try again.",
        kind: "error",
      });
    }
  }

  function handleStop() {
    runningRef.current = false;
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    stopCamera();
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setPhase("idle");
    setStatus("Camera stopped.");
    setFeedback({ message: "", kind: "" });
  }

  function handleReset() {
    counterRef.current.reset();
    smoothedAngleRef.current = null;
    setReps(0);
    setDepth(null);
    setAngle(null);
    setSide(null);
    setFeedback({ message: "", kind: "" });
  }

  return (
    <main>
      <h1>AI-PT Analyzer: Squat Tracker (Prototype)</h1>

      <div className="stage">
        <video ref={videoRef} playsInline muted aria-label="Mirrored webcam view" />
        <canvas ref={canvasRef} aria-hidden="true" />
      </div>

      <aside className="panel" aria-label="Squat tracking">
        <div className="stat"><span>Knee angle</span><span className="big">{angle === null ? "--" : `${angle}°`}</span></div>
        <div className="stat"><span>Reps</span><span className="big">{reps}</span></div>
        <div className="stat"><span>Last rep depth</span><span>{depth === null ? "--" : `${depth}°`}</span></div>
        <div className="stat"><span>Tracking side</span><span>{side ?? "--"}</span></div>
        <div id="feedback" className={feedback.kind} aria-live="polite">{feedback.message}</div>
        <button type="button" onClick={handleStart} disabled={phase === "loading" || phase === "running"}>
          {phase === "idle" ? "Start camera" : phase === "loading" ? "Loading..." : phase === "running" ? "Camera on" : "Try again"}
        </button>
        <button type="button" className="secondary" onClick={handleStop} disabled={phase !== "running"}>
          Stop camera
        </button>
        <button type="button" className="secondary" onClick={handleReset}>Reset reps</button>
        <div id="status" role="status">{status}</div>
      </aside>
    </main>
  );
}
