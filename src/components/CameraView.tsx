import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ISLGestureRecognizer, DetectionFrame } from '../services/gestureRecognizer';
import { GlobalHandTracker } from '../services/realHandTracker';
import { RecognitionState } from '../types/isl';
import {
  Camera,
  CameraOff,
  FlipHorizontal,
  Maximize2,
  Minimize2,
  RefreshCw,
  Sparkles,
  Sliders,
  Hand,
  CheckCircle2,
  Zap,
} from 'lucide-react';

interface CameraViewProps {
  onSignRecognized: (state: RecognitionState) => void;
  activeSignId?: string | null;
  className?: string;
  holdProgress?: number;
  holdingSignName?: string | null;
  isCommitted?: boolean;
  bufferSpeedLabel?: string;
}

export const CameraView: React.FC<CameraViewProps> = ({
  onSignRecognized,
  activeSignId,
  className = '',
  holdProgress = 0,
  holdingSignName = null,
  isCommitted = false,
  bufferSpeedLabel = '1.8s',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // Tracking engine state
  const [realHandDetected, setRealHandDetected] = useState<boolean>(false);
  const [detectedFingerCount, setDetectedFingerCount] = useState<number>(0);

  // Recognition telemetry
  const [telemetry, setTelemetry] = useState<RecognitionState>({
    status: 'idle',
    currentSign: null,
    confidence: 0,
    fps: 0,
    latencyMs: 14,
    handsDetected: 0,
    facialExpression: 'Neutral',
  });

  const recognizerRef = useRef<ISLGestureRecognizer>(new ISLGestureRecognizer());
  const animationFrameRef = useRef<number | null>(null);
  const isProcessingFrameRef = useRef<boolean>(false);

  // Optional manual test gesture override if user wants to test a specific sign
  const [manualOverrideGesture, setManualOverrideGesture] = useState<string | null>(null);

  // Generate fallback simulated frame only when manual test gesture is clicked
  const generateSimulatedFrame = useCallback((gesture: string): DetectionFrame => {
    const time = Date.now() / 800;
    const wobble = Math.sin(time) * 0.015;

    if (gesture === 'namaste') {
      const handL = [
        { x: 0.44 + wobble, y: 0.65 },
        { x: 0.45, y: 0.6 }, { x: 0.46, y: 0.54 }, { x: 0.47, y: 0.48 }, { x: 0.48, y: 0.42 },
        { x: 0.45, y: 0.55 }, { x: 0.46, y: 0.45 }, { x: 0.47, y: 0.38 }, { x: 0.48, y: 0.3 },
        { x: 0.47, y: 0.56 }, { x: 0.48, y: 0.45 }, { x: 0.49, y: 0.37 }, { x: 0.49, y: 0.28 },
        { x: 0.49, y: 0.58 }, { x: 0.5, y: 0.48 }, { x: 0.5, y: 0.4 }, { x: 0.51, y: 0.33 },
        { x: 0.51, y: 0.6 }, { x: 0.52, y: 0.52 }, { x: 0.52, y: 0.45 }, { x: 0.53, y: 0.38 },
      ];
      const handR = [
        { x: 0.56 - wobble, y: 0.65 },
        { x: 0.55, y: 0.6 }, { x: 0.54, y: 0.54 }, { x: 0.53, y: 0.48 }, { x: 0.52, y: 0.42 },
        { x: 0.55, y: 0.55 }, { x: 0.54, y: 0.45 }, { x: 0.53, y: 0.38 }, { x: 0.52, y: 0.3 },
        { x: 0.53, y: 0.56 }, { x: 0.52, y: 0.45 }, { x: 0.51, y: 0.37 }, { x: 0.51, y: 0.28 },
        { x: 0.51, y: 0.58 }, { x: 0.5, y: 0.48 }, { x: 0.5, y: 0.4 }, { x: 0.49, y: 0.33 },
        { x: 0.49, y: 0.6 }, { x: 0.48, y: 0.52 }, { x: 0.48, y: 0.45 }, { x: 0.47, y: 0.38 },
      ];
      return {
        hands: [handL, handR],
        handedness: ['Left', 'Right'],
        facialExpressions: { mouthOpen: false, smiling: true, eyebrowsRaised: false },
        timestamp: Date.now(),
      };
    }

    if (gesture === 'help-emergency') {
      const basePalm = [
        { x: 0.38, y: 0.65 },
        { x: 0.42, y: 0.65 }, { x: 0.46, y: 0.65 }, { x: 0.5, y: 0.65 }, { x: 0.54, y: 0.65 },
        { x: 0.42, y: 0.68 }, { x: 0.48, y: 0.68 }, { x: 0.54, y: 0.68 }, { x: 0.6, y: 0.68 },
        { x: 0.42, y: 0.7 }, { x: 0.48, y: 0.7 }, { x: 0.54, y: 0.7 }, { x: 0.6, y: 0.7 },
        { x: 0.42, y: 0.72 }, { x: 0.48, y: 0.72 }, { x: 0.54, y: 0.72 }, { x: 0.6, y: 0.72 },
        { x: 0.42, y: 0.74 }, { x: 0.48, y: 0.74 }, { x: 0.54, y: 0.74 }, { x: 0.6, y: 0.74 },
      ];
      const topFist = [
        { x: 0.5 + wobble, y: 0.6 },
        { x: 0.48, y: 0.55 }, { x: 0.48, y: 0.5 }, { x: 0.48, y: 0.45 }, { x: 0.48, y: 0.4 },
        { x: 0.52, y: 0.58 }, { x: 0.54, y: 0.58 }, { x: 0.52, y: 0.62 }, { x: 0.5, y: 0.62 },
        { x: 0.53, y: 0.58 }, { x: 0.55, y: 0.58 }, { x: 0.53, y: 0.62 }, { x: 0.51, y: 0.62 },
        { x: 0.54, y: 0.58 }, { x: 0.56, y: 0.58 }, { x: 0.54, y: 0.62 }, { x: 0.52, y: 0.62 },
        { x: 0.55, y: 0.58 }, { x: 0.57, y: 0.58 }, { x: 0.55, y: 0.62 }, { x: 0.53, y: 0.62 },
      ];
      return {
        hands: [basePalm, topFist],
        handedness: ['Left', 'Right'],
        facialExpressions: { mouthOpen: false, smiling: false, eyebrowsRaised: true },
        timestamp: Date.now(),
      };
    }

    if (gesture === 'chai-tea') {
      const pinchHand = [
        { x: 0.5 + wobble, y: 0.65 },
        { x: 0.48, y: 0.6 }, { x: 0.47, y: 0.55 }, { x: 0.48, y: 0.5 }, { x: 0.49, y: 0.46 },
        { x: 0.5, y: 0.58 }, { x: 0.5, y: 0.52 }, { x: 0.5, y: 0.48 }, { x: 0.49, y: 0.46 },
        { x: 0.53, y: 0.6 }, { x: 0.54, y: 0.55 }, { x: 0.53, y: 0.58 }, { x: 0.52, y: 0.62 },
        { x: 0.55, y: 0.6 }, { x: 0.56, y: 0.55 }, { x: 0.55, y: 0.58 }, { x: 0.54, y: 0.62 },
        { x: 0.57, y: 0.6 }, { x: 0.58, y: 0.55 }, { x: 0.57, y: 0.58 }, { x: 0.56, y: 0.62 },
      ];
      return {
        hands: [pinchHand],
        handedness: ['Right'],
        facialExpressions: { mouthOpen: false, smiling: true, eyebrowsRaised: false },
        timestamp: Date.now(),
      };
    }

    // Default single hand W (Water)
    const singleHand = [
      { x: 0.5 + wobble, y: 0.68 },
      { x: 0.45, y: 0.64 }, { x: 0.42, y: 0.6 }, { x: 0.44, y: 0.58 }, { x: 0.47, y: 0.58 },
      { x: 0.46, y: 0.58 }, { x: 0.45, y: 0.5 }, { x: 0.44, y: 0.42 }, { x: 0.43, y: 0.34 },
      { x: 0.5, y: 0.58 }, { x: 0.5, y: 0.48 }, { x: 0.5, y: 0.4 }, { x: 0.5, y: 0.32 },
      { x: 0.54, y: 0.58 }, { x: 0.55, y: 0.5 }, { x: 0.56, y: 0.42 }, { x: 0.57, y: 0.34 },
      { x: 0.57, y: 0.62 }, { x: 0.56, y: 0.6 }, { x: 0.54, y: 0.59 }, { x: 0.52, y: 0.58 },
    ];

    return {
      hands: [singleHand],
      handedness: ['Right'],
      facialExpressions: { mouthOpen: false, smiling: false, eyebrowsRaised: false },
      timestamp: Date.now(),
    };
  }, []);

  // Initialize camera stream
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function initCamera() {
      if (!isCameraActive) return;

      try {
        setCameraError(null);
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode,
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err: any) {
        console.warn('Camera access unavailable:', err);
        setCameraError(
          err.name === 'NotAllowedError'
            ? 'Camera permission denied. Enable camera access or use the test gestures below.'
            : 'No camera hardware detected. Use interactive gesture testing below.'
        );
      }
    }

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isCameraActive, facingMode]);

  // Main real-time hand recognition loop
  useEffect(() => {
    let active = true;

    const processFrame = async () => {
      if (!active) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');

      if (canvas && ctx) {
        const width = canvas.width;
        const height = canvas.height;

        let frameToAnalyze: DetectionFrame = {
          hands: [],
          handedness: [],
          facialExpressions: { mouthOpen: false, smiling: false, eyebrowsRaised: false },
          timestamp: Date.now(),
        };

        // 1. Process REAL hand from user camera feed if active
        if (
          video &&
          video.readyState >= 2 &&
          isCameraActive &&
          !cameraError &&
          !manualOverrideGesture &&
          !isProcessingFrameRef.current
        ) {
          isProcessingFrameRef.current = true;
          try {
            const realFrame = await GlobalHandTracker.processVideoFrame(video);
            if (realFrame.hands.length > 0) {
              frameToAnalyze = realFrame;
              setRealHandDetected(true);

              // Estimate finger count from first hand
              const hand1 = realFrame.hands[0];
              const extFingers = [8, 12, 16, 20].filter(
                (tip) => hand1[tip] && hand1[tip].y < hand1[tip - 2].y
              ).length;
              setDetectedFingerCount(extFingers);
            } else {
              setRealHandDetected(false);
              setDetectedFingerCount(0);
            }
          } catch (_) {
          } finally {
            isProcessingFrameRef.current = false;
          }
        }

        // 2. If manual override is explicitly selected or activeSignId is requested
        if (manualOverrideGesture || (activeSignId && !realHandDetected)) {
          const testSign = manualOverrideGesture || activeSignId || 'namaste';
          frameToAnalyze = generateSimulatedFrame(testSign);
        }

        // 3. Analyze gesture via ISLGestureRecognizer
        const result = recognizerRef.current.analyzeFrame(frameToAnalyze);
        setTelemetry(result);
        onSignRecognized(result);

        // 4. Draw futuristic neon overlay on canvas
        if (showSkeleton && frameToAnalyze.hands.length > 0) {
          recognizerRef.current.drawOverlay(
            ctx,
            frameToAnalyze,
            width,
            height,
            result.currentSign?.name || null
          );
        } else {
          ctx.clearRect(0, 0, width, height);
        }
      }

      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    animationFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      active = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    isCameraActive,
    cameraError,
    manualOverrideGesture,
    activeSignId,
    realHandDetected,
    showSkeleton,
    generateSimulatedFrame,
    onSignRecognized,
  ]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl ${className}`}
    >
      {/* Viewport Frame */}
      <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* Real User Webcam Video Element */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`absolute inset-0 w-full h-full object-cover ${
            isMirrored ? 'scale-x-[-1]' : ''
          } ${cameraError || !isCameraActive ? 'hidden' : 'block'}`}
        />

        {/* Real-Time Landmark Canvas Overlay */}
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className={`absolute inset-0 w-full h-full object-cover pointer-events-none z-10 ${
            isMirrored ? 'scale-x-[-1]' : ''
          }`}
        />

        {/* Fallback Display if Camera is Off or Unavailable */}
        {(cameraError || !isCameraActive) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-0 bg-gradient-to-b from-slate-900/90 to-slate-950">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 mb-3">
              <CameraOff className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-white">
              {cameraError || 'Camera is paused'}
            </p>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Enable your webcam above to test your real hand gestures directly, or click any sign in the quick tray below.
            </p>
          </div>
        )}

        {/* Real Hand Sensor HUD (Top-Left) */}
        <div className="absolute top-3.5 left-3.5 z-20 pointer-events-none flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold tracking-wide backdrop-blur-md shadow-md border ${
                realHandDetected
                  ? 'bg-emerald-950/85 text-emerald-300 border-emerald-500/50'
                  : telemetry.status === 'recognized'
                  ? 'bg-cyan-950/85 text-cyan-300 border-cyan-500/50'
                  : 'bg-slate-900/85 text-slate-300 border-slate-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              {realHandDetected
                ? 'Tracking Real Hand'
                : telemetry.status === 'recognized'
                ? 'Sign Recognized'
                : 'Looking for Hands'}
            </span>

            {realHandDetected && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-emerald-300 bg-slate-950/80 backdrop-blur-md border border-emerald-500/30">
                <Hand className="w-3.5 h-3.5 text-emerald-400" />
                {detectedFingerCount} Fingers Up
              </span>
            )}
          </div>
        </div>

        {/* Real-Time Telemetry HUD (Top-Right) */}
        <div className="absolute top-3.5 right-3.5 z-20 pointer-events-none flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-xl border border-slate-800 shadow-md tabular-nums">
          <span>{telemetry.fps} FPS</span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-400">{telemetry.latencyMs}ms</span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400 font-bold">{telemetry.confidence}% Conf</span>
        </div>

        {/* Hold to Confirm Progress Ring & Banner */}
        {holdingSignName && holdProgress > 0 && (
          <div className="absolute top-14 left-3.5 right-3.5 z-20 pointer-events-none flex justify-center">
            <div
              className={`flex items-center gap-3 px-4 py-2 rounded-2xl backdrop-blur-xl border shadow-2xl transition-all duration-200 ${
                isCommitted || holdProgress >= 100
                  ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/60 ring-2 ring-emerald-500/30 scale-105'
                  : 'bg-slate-950/90 text-white border-cyan-500/50'
              }`}
            >
              <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={
                      isCommitted || holdProgress >= 100
                        ? 'text-emerald-400 transition-all duration-150'
                        : 'text-cyan-400 transition-all duration-150'
                    }
                    strokeDasharray={`${holdProgress}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-[10px] font-mono font-bold">
                  {isCommitted || holdProgress >= 100 ? '✓' : `${holdProgress}%`}
                </span>
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-cyan-400">
                    {isCommitted || holdProgress >= 100 ? 'Added to Sentence' : 'Holding Gesture'}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    Buffer Speed: {bufferSpeedLabel}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-extrabold truncate text-white">
                  {holdingSignName}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Floating Card: Active Recognized Meaning Preview */}
        {telemetry.currentSign && (
          <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-none">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-cyan-500/50 shadow-2xl">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                    {realHandDetected ? 'Real Hand Detected:' : 'Live ISL Gesture:'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ({telemetry.currentSign.isTwoHanded ? 'Two-Handed' : 'One-Handed'})
                  </span>
                </div>
                <p className="text-base sm:text-lg font-extrabold text-white">
                  {telemetry.currentSign.name}
                </p>
                <p className="text-xs text-slate-300 line-clamp-1">
                  {telemetry.currentSign.description}
                </p>
              </div>

              <div className="text-right shrink-0 ml-4">
                <span className="text-sm font-mono font-extrabold text-emerald-400">
                  {telemetry.confidence}% match
                </span>
                <p className="text-[10px] text-cyan-300 font-semibold mt-0.5">
                  Output Ready
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Camera Toolbar Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-900 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCameraActive(!isCameraActive)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              isCameraActive
                ? 'bg-rose-950/60 text-rose-300 border border-rose-500/30 hover:bg-rose-900/60'
                : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/60'
            }`}
          >
            {isCameraActive ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
            <span>{isCameraActive ? 'Pause Camera' : 'Start Camera'}</span>
          </button>

          <button
            onClick={() => setIsMirrored(!isMirrored)}
            className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors"
            title="Mirror flip camera view"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>

          <button
            onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
            className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors"
            title="Switch front / rear camera"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowSkeleton(!showSkeleton)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              showSkeleton
                ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800'
            }`}
            title="Toggle hand skeletal mesh"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">21-Point Skeleton</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {manualOverrideGesture && (
            <button
              onClick={() => setManualOverrideGesture(null)}
              className="text-xs font-bold text-cyan-400 hover:underline px-2 py-1"
            >
              Back to Live Real Hand
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Real Hand Gesture Guidance Strip */}
      <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between gap-3 text-xs">
        <span className="text-slate-400 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>
            Hold your hand clearly in frame: <strong>Namaste</strong> (2 hands joined), <strong>Water</strong> (3 fingers), <strong>Number 2</strong> (V-sign), <strong>Stop</strong> (Open palm), <strong>Chai</strong> (Pinch).
          </span>
        </span>
      </div>
    </div>
  );
};
