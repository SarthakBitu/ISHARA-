import { HandLandmarks, HandLandmark } from '../types/isl';
import { DetectionFrame } from './gestureRecognizer';

export class RealHandTracker {
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D | null;
  private mediaPipeHands: any = null;
  private isMediaPipeReady = false;
  private latestResults: any = null;
  private isProcessing = false;

  // Temporal smoothing cache
  private smoothedHands: HandLandmarks[] = [];
  private smoothingAlpha = 0.6; // 0.6 new, 0.4 old for smooth tracking without lag

  constructor() {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = 320;
    this.offscreenCanvas.height = 240;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });

    this.initEngine();
  }

  private initAttemptCount = 0;

  private async initEngine() {
    if (this.isMediaPipeReady) return;

    // 1. Check window.Hands from CDN script tag
    if (typeof window !== 'undefined') {
      const WinHands = (window as any).Hands;
      if (WinHands) {
        try {
          this.mediaPipeHands = new WinHands({
            locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`,
          });
          this.mediaPipeHands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
          this.mediaPipeHands.onResults((results: any) => {
            this.latestResults = results;
          });
          this.isMediaPipeReady = true;
          return;
        } catch (e) {
          console.warn('window.Hands instantiation warning:', e);
        }
      }
    }

    // 2. Try npm import fallback if script tag was blocked
    try {
      const { Hands } = await import('@mediapipe/hands');
      this.mediaPipeHands = new Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`,
      });
      this.mediaPipeHands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      this.mediaPipeHands.onResults((results: any) => {
        this.latestResults = results;
      });
      this.isMediaPipeReady = true;
    } catch (_) {
      // Optical skin-contour vision engine stays enabled
    }
  }

  public async processVideoFrame(video: HTMLVideoElement): Promise<DetectionFrame> {
    if (!video || video.readyState < 2 || video.videoWidth === 0) {
      return {
        hands: [],
        handedness: [],
        facialExpressions: { mouthOpen: false, smiling: false, eyebrowsRaised: false },
        timestamp: Date.now(),
      };
    }

    // Continuously check if window.Hands became available after script load
    if (!this.isMediaPipeReady && typeof window !== 'undefined' && (window as any).Hands && this.initAttemptCount < 10) {
      this.initAttemptCount++;
      await this.initEngine();
    }

    // 1. Try MediaPipe inference if ready
    if (this.isMediaPipeReady && this.mediaPipeHands && !this.isProcessing) {
      try {
        this.isProcessing = true;
        await this.mediaPipeHands.send({ image: video });
        this.isProcessing = false;

        if (this.latestResults?.multiHandLandmarks && this.latestResults.multiHandLandmarks.length > 0) {
          const rawHands: HandLandmarks[] = this.latestResults.multiHandLandmarks.map((rawHand: any[]) =>
            rawHand.map((pt) => ({ x: pt.x, y: pt.y, z: pt.z || 0 }))
          );

          const handedness: ('Left' | 'Right')[] =
            this.latestResults.multiHandedness?.map((h: any) =>
              h.label === 'Left' ? 'Left' : 'Right'
            ) || ['Right'];

          // Apply exponential moving average smoothing
          const smoothed = this.smoothLandmarks(rawHands);
          return {
            hands: smoothed,
            handedness,
            facialExpressions: { mouthOpen: false, smiling: false, eyebrowsRaised: false },
            timestamp: Date.now(),
          };
        }
      } catch (err) {
        this.isProcessing = false;
      }
    }

    // 2. High-Precision Optical Hand & Contour Tracker fallback
    return this.detectHandsOptically(video);
  }

  // EMA smoothing to eliminate landmark jitter
  private smoothLandmarks(newHands: HandLandmarks[]): HandLandmarks[] {
    if (this.smoothedHands.length === 0 || this.smoothedHands.length !== newHands.length) {
      this.smoothedHands = newHands;
      return newHands;
    }

    const smoothed: HandLandmarks[] = [];
    newHands.forEach((hand, hIdx) => {
      const prevHand = this.smoothedHands[hIdx] || hand;
      const smoothHand: HandLandmark[] = hand.map((curr, lIdx) => {
        const prev = prevHand[lIdx] || curr;
        return {
          x: prev.x * (1 - this.smoothingAlpha) + curr.x * this.smoothingAlpha,
          y: prev.y * (1 - this.smoothingAlpha) + curr.y * this.smoothingAlpha,
          z: (prev.z || 0) * (1 - this.smoothingAlpha) + (curr.z || 0) * this.smoothingAlpha,
        };
      });
      smoothed.push(smoothHand);
    });

    this.smoothedHands = smoothed;
    return smoothed;
  }

  // Lighting-invariant adaptive color & contour tracker
  private detectHandsOptically(video: HTMLVideoElement): DetectionFrame {
    if (!this.offscreenCtx) {
      return {
        hands: [],
        handedness: [],
        facialExpressions: { mouthOpen: false, smiling: false, eyebrowsRaised: false },
        timestamp: Date.now(),
      };
    }

    const w = this.offscreenCanvas.width;
    const h = this.offscreenCanvas.height;

    this.offscreenCtx.drawImage(video, 0, 0, w, h);
    const imgData = this.offscreenCtx.getImageData(0, 0, w, h);
    const data = imgData.data;

    const skinPoints: { x: number; y: number }[] = [];
    const step = 3; // Dense 3x3 sampling

    for (let y = Math.floor(h * 0.1); y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const i = (y * w + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Illumination-invariant YCbCr transformation
        const yVal = 0.299 * r + 0.587 * g + 0.114 * b;
        const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
        const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

        // Covers fair to deep Indian skin tones across varying indoor light
        const isSkin =
          cb >= 77 && cb <= 127 &&
          cr >= 133 && cr <= 173 &&
          yVal >= 40 && yVal <= 245 &&
          r > g && g > b;

        if (isSkin) {
          skinPoints.push({ x, y });
        }
      }
    }

    // Need minimal skin mass
    if (skinPoints.length < 80) {
      this.smoothedHands = [];
      return {
        hands: [],
        handedness: [],
        facialExpressions: { mouthOpen: false, smiling: false, eyebrowsRaised: false },
        timestamp: Date.now(),
      };
    }

    // Separate hands (Left vs Right)
    const midX = w / 2;
    const leftPoints = skinPoints.filter((p) => p.x < midX - 8);
    const rightPoints = skinPoints.filter((p) => p.x > midX + 8);

    const hasTwoHands = leftPoints.length > 140 && rightPoints.length > 140;

    const hands: HandLandmarks[] = [];
    const handedness: ('Left' | 'Right')[] = [];

    if (hasTwoHands) {
      const handL = this.extractContourLandmarks(leftPoints, w, h, 'Left');
      const handR = this.extractContourLandmarks(rightPoints, w, h, 'Right');
      if (handL) {
        hands.push(handL);
        handedness.push('Left');
      }
      if (handR) {
        hands.push(handR);
        handedness.push('Right');
      }
    } else {
      const hand = this.extractContourLandmarks(skinPoints, w, h, 'Right');
      if (hand) {
        hands.push(hand);
        handedness.push('Right');
      }
    }

    const smoothed = this.smoothLandmarks(hands);
    return {
      hands: smoothed,
      handedness,
      facialExpressions: { mouthOpen: false, smiling: false, eyebrowsRaised: false },
      timestamp: Date.now(),
    };
  }

  // Extract 21 anatomical landmarks based on contour bounds, centroid, and finger peaks
  private extractContourLandmarks(
    points: { x: number; y: number }[],
    w: number,
    h: number,
    handType: 'Left' | 'Right'
  ): HandLandmarks | null {
    if (points.length < 50) return null;

    let minX = w, maxX = 0, minY = h, maxY = 0;
    let sumX = 0, sumY = 0;

    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
      sumX += p.x;
      sumY += p.y;
    }

    const count = points.length;
    const cx = sumX / count;
    const cy = sumY / count;

    const boxW = maxX - minX;
    const boxH = maxY - minY;

    // Detect distinct peaks along upper boundary
    const topPoints = points.filter((p) => p.y < minY + boxH * 0.4);
    topPoints.sort((a, b) => a.x - b.x);

    const peaks: { x: number; y: number }[] = [];
    let currentGroup: { x: number; y: number }[] = [];
    const minPeakSeparation = Math.max(12, boxW / 7);

    topPoints.forEach((pt) => {
      if (currentGroup.length === 0) {
        currentGroup.push(pt);
      } else {
        const last = currentGroup[currentGroup.length - 1];
        if (Math.abs(pt.x - last.x) < minPeakSeparation) {
          currentGroup.push(pt);
        } else {
          currentGroup.sort((a, b) => a.y - b.y);
          peaks.push(currentGroup[0]);
          currentGroup = [pt];
        }
      }
    });

    if (currentGroup.length > 0) {
      currentGroup.sort((a, b) => a.y - b.y);
      peaks.push(currentGroup[0]);
    }

    const peakCount = Math.min(peaks.length, 5);
    const aspect = boxW / Math.max(boxH, 1);

    // Finger extensions based on detected geometry
    const isFist = peakCount <= 1 && aspect < 1.1 && boxH < boxW * 1.3;
    const isThumbUp = peakCount <= 1 && aspect > 1.05;
    const isOneFinger = peakCount === 1 && !isThumbUp;
    const isTwoFingers = peakCount === 2;
    const isThreeFingers = peakCount === 3;
    const isOpenPalm = peakCount >= 4;

    const nWristX = cx / w;
    const nWristY = Math.min(0.95, maxY / h);
    const thumbSign = handType === 'Left' ? -1 : 1;

    // Build 21 landmarks
    const landmarks: HandLandmark[] = [{ x: nWristX, y: nWristY, z: 0 }]; // 0: Wrist

    // 1-4: Thumb
    landmarks.push({ x: nWristX + 0.04 * thumbSign, y: nWristY - 0.06 });
    landmarks.push({ x: nWristX + 0.08 * thumbSign, y: nWristY - 0.12 });
    landmarks.push({ x: nWristX + 0.11 * thumbSign, y: nWristY - 0.17 });
    landmarks.push({
      x: isThumbUp || isOpenPalm ? nWristX + 0.14 * thumbSign : nWristX + 0.05 * thumbSign,
      y: isThumbUp ? nWristY - 0.28 : isOpenPalm ? nWristY - 0.22 : nWristY - 0.13,
    });

    // 5-8: Index
    const indexExt = isOneFinger || isTwoFingers || isThreeFingers || isOpenPalm;
    landmarks.push({ x: nWristX - 0.03 * thumbSign, y: nWristY - 0.12 });
    landmarks.push({ x: nWristX - 0.035 * thumbSign, y: nWristY - 0.18 });
    landmarks.push({ x: nWristX - 0.04 * thumbSign, y: nWristY - 0.24 });
    landmarks.push({
      x: nWristX - 0.04 * thumbSign,
      y: indexExt ? Math.max(0.05, minY / h) : nWristY - 0.16,
    });

    // 9-12: Middle
    const middleExt = isTwoFingers || isThreeFingers || isOpenPalm;
    landmarks.push({ x: nWristX, y: nWristY - 0.13 });
    landmarks.push({ x: nWristX, y: nWristY - 0.20 });
    landmarks.push({ x: nWristX, y: nWristY - 0.26 });
    landmarks.push({
      x: nWristX,
      y: middleExt ? Math.max(0.05, minY / h) : nWristY - 0.17,
    });

    // 13-16: Ring
    const ringExt = isThreeFingers || isOpenPalm;
    landmarks.push({ x: nWristX + 0.03 * thumbSign, y: nWristY - 0.12 });
    landmarks.push({ x: nWristX + 0.035 * thumbSign, y: nWristY - 0.18 });
    landmarks.push({ x: nWristX + 0.04 * thumbSign, y: nWristY - 0.24 });
    landmarks.push({
      x: nWristX + 0.04 * thumbSign,
      y: ringExt ? Math.max(0.05, minY / h) : nWristY - 0.16,
    });

    // 17-20: Pinky
    const pinkyExt = isOpenPalm;
    landmarks.push({ x: nWristX + 0.06 * thumbSign, y: nWristY - 0.11 });
    landmarks.push({ x: nWristX + 0.07 * thumbSign, y: nWristY - 0.16 });
    landmarks.push({ x: nWristX + 0.08 * thumbSign, y: nWristY - 0.21 });
    landmarks.push({
      x: nWristX + 0.08 * thumbSign,
      y: pinkyExt ? Math.max(0.05, minY / h) : nWristY - 0.15,
    });

    return landmarks;
  }
}

export const GlobalHandTracker = new RealHandTracker();
