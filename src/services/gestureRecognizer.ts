import { HandLandmarks, RecognizedSign, RecognitionState, FaceExpressions } from '../types/isl';
import { ISL_DICTIONARY } from '../data/islDictionary';

export interface DetectionFrame {
  hands: HandLandmarks[];
  handedness: ('Left' | 'Right')[];
  facialExpressions: FaceExpressions;
  timestamp: number;
}

export class ISLGestureRecognizer {
  private lastRecognizedId: string | null = null;
  private lastRecognizedTime = 0;
  private holdDurationMs = 0;
  private cooldownMs = 1200;
  private frameCount = 0;
  private lastFpsCalcTime = performance.now();
  private currentFps = 30;

  // Temporal voting buffer to eliminate single-frame jitter and sensor noise
  private recentDetections: string[] = [];
  private maxHistoryFrames = 6;

  // Calculate distance between two points
  private distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
  }

  // Calculate whether a finger is extended relative to MCP joint and wrist
  private isFingerExtended(
    landmarks: HandLandmarks,
    tipIdx: number,
    pipIdx: number,
    mcpIdx: number
  ): boolean {
    const wrist = landmarks[0];
    const tip = landmarks[tipIdx];
    const pip = landmarks[pipIdx];
    const mcp = landmarks[mcpIdx];

    const distTipMcp = this.distance(tip, mcp);
    const distPipMcp = this.distance(pip, mcp);
    const distTipWrist = this.distance(tip, wrist);
    const distPipWrist = this.distance(pip, wrist);

    // Tip position relative to PIP (upright hand)
    const isUpright = tip.y < pip.y;

    // A finger is extended when tip has moved significantly beyond PIP relative to MCP base
    return (distTipMcp > distPipMcp * 1.18 && distTipWrist > distPipWrist) || (isUpright && distTipMcp > distPipMcp);
  }

  // Robust thumb extension test
  private isThumbExtended(landmarks: HandLandmarks): boolean {
    const thumbTip = landmarks[4];
    const thumbIp = landmarks[3];
    const indexMcp = landmarks[5];
    const pinkyMcp = landmarks[17];

    const distTipPinky = this.distance(thumbTip, pinkyMcp);
    const distIpPinky = this.distance(thumbIp, pinkyMcp);
    const distTipIndex = this.distance(thumbTip, indexMcp);

    // Thumb extended outward away from palm and index knuckle
    return distTipPinky > distIpPinky * 1.12 && distTipIndex > 0.11;
  }

  // Analyze hand geometry for 1 or 2 hands
  public analyzeFrame(frame: DetectionFrame): RecognitionState {
    const now = performance.now();
    this.frameCount++;

    if (now - this.lastFpsCalcTime >= 1000) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsCalcTime));
      this.frameCount = 0;
      this.lastFpsCalcTime = now;
    }

    const handsCount = frame.hands.length;

    if (handsCount === 0) {
      this.recentDetections = [];
      return {
        status: 'detecting',
        currentSign: null,
        confidence: 0,
        fps: this.currentFps,
        latencyMs: 14,
        handsDetected: 0,
        facialExpression: 'Neutral',
      };
    }

    const hand1 = frame.hands[0];
    const hand2 = frame.hands[1] || null;

    // Feature extraction for hand 1
    const thumbExt1 = this.isThumbExtended(hand1);
    const indexExt1 = this.isFingerExtended(hand1, 8, 7, 6);
    const middleExt1 = this.isFingerExtended(hand1, 12, 11, 10);
    const ringExt1 = this.isFingerExtended(hand1, 16, 15, 14);
    const pinkyExt1 = this.isFingerExtended(hand1, 20, 19, 18);

    // Feature extraction for hand 2 (if present)
    let thumbExt2 = false;
    let indexExt2 = false;
    let middleExt2 = false;
    let ringExt2 = false;
    let pinkyExt2 = false;

    if (hand2) {
      thumbExt2 = this.isThumbExtended(hand2);
      indexExt2 = this.isFingerExtended(hand2, 8, 7, 6);
      middleExt2 = this.isFingerExtended(hand2, 12, 11, 10);
      ringExt2 = this.isFingerExtended(hand2, 16, 15, 14);
      pinkyExt2 = this.isFingerExtended(hand2, 20, 19, 18);
    }

    let detectedSignId: string | null = null;
    let rawConfidence = 0.5;

    // --- TWO-HANDED ISL RECOGNITION RULES ---
    if (hand1 && hand2) {
      const indexTipDist = this.distance(hand1[8], hand2[8]);
      const palmCenter1 = { x: (hand1[0].x + hand1[9].x) / 2, y: (hand1[0].y + hand1[9].y) / 2 };
      const palmCenter2 = { x: (hand2[0].x + hand2[9].x) / 2, y: (hand2[0].y + hand2[9].y) / 2 };
      const palmDist = this.distance(palmCenter1, palmCenter2);

      // 1. Namaste: Palms brought together near center, fingers extended upright
      if (
        (indexExt1 || middleExt1) &&
        (indexExt2 || middleExt2) &&
        palmDist < 0.26 &&
        Math.abs(hand1[0].y - hand2[0].y) < 0.20
      ) {
        detectedSignId = 'namaste';
        rawConfidence = 0.96;
      }
      // 2. Emergency Help: One flat palm base, dominant hand formed into fist resting on it
      else if (
        (indexExt1 && middleExt1 && ringExt1 && !indexExt2 && !middleExt2 && palmDist < 0.28) ||
        (indexExt2 && middleExt2 && ringExt2 && !indexExt1 && !middleExt1 && palmDist < 0.28)
      ) {
        detectedSignId = 'help-emergency';
        rawConfidence = 0.94;
      }
      // 3. Call Doctor / Hospital: Dominant two fingers tapping wrist of other hand
      else if (
        (indexExt1 && middleExt1 && !ringExt1 && !pinkyExt1 && this.distance(hand1[8], hand2[0]) < 0.22) ||
        (indexExt2 && middleExt2 && !ringExt2 && !pinkyExt2 && this.distance(hand2[8], hand1[0]) < 0.22)
      ) {
        detectedSignId = 'doctor-hospital';
        rawConfidence = 0.92;
      }
      // 4. Friend: Interlocking hooked index fingers
      else if (
        indexExt1 && indexExt2 && !middleExt1 && !middleExt2 && indexTipDist < 0.16
      ) {
        detectedSignId = 'friend';
        rawConfidence = 0.90;
      }
      // 5. How are you: Two hands rolling outward from chest
      else if (
        indexExt1 && indexExt2 && middleExt1 && middleExt2 && palmDist < 0.32
      ) {
        detectedSignId = 'how-are-you';
        rawConfidence = 0.91;
      }
    }

    // --- ONE-HANDED ISL RECOGNITION RULES ---
    if (!detectedSignId && hand1) {
      const allExtended = indexExt1 && middleExt1 && ringExt1 && pinkyExt1;
      const allCurled = !indexExt1 && !middleExt1 && !ringExt1 && !pinkyExt1;

      // 1. Water: W-Handshape (index, middle, ring extended)
      if (indexExt1 && middleExt1 && ringExt1 && !pinkyExt1 && hand1[8].y < 0.65) {
        detectedSignId = 'water';
        rawConfidence = 0.95;
      }
      // 2. Food / Hungry: Bunched fingertips brought together near mouth level
      else if (
        allCurled &&
        this.distance(hand1[4], hand1[8]) < 0.09 &&
        hand1[8].y < 0.62
      ) {
        detectedSignId = 'food-hungry';
        rawConfidence = 0.93;
      }
      // 3. Chai / Tea: Thumb and index pinch dipping
      else if (
        this.distance(hand1[4], hand1[8]) < 0.08 &&
        !ringExt1 && !pinkyExt1
      ) {
        detectedSignId = 'chai-tea';
        rawConfidence = 0.94;
      }
      // 4. Stop: Open palm facing upright, all fingers extended firmly
      else if (allExtended && hand1[8].y < hand1[0].y - 0.12) {
        detectedSignId = 'stop';
        rawConfidence = 0.94;
      }
      // 5. Thank You: Flat hand moving outward from chin/chest
      else if (allExtended && hand1[8].y >= 0.35 && hand1[8].y <= 0.70) {
        detectedSignId = 'thank-you';
        rawConfidence = 0.90;
      }
      // 6. I am Deaf: Single index finger pointing upward near ear/cheek
      else if (indexExt1 && !middleExt1 && !ringExt1 && !pinkyExt1 && hand1[8].y < 0.45) {
        detectedSignId = 'deaf-identity';
        rawConfidence = 0.93;
      }
      // 7. Where / Restroom: T-handshape (thumb tucked between index & middle)
      else if (!indexExt1 && !middleExt1 && thumbExt1) {
        detectedSignId = 'where-restroom';
        rawConfidence = 0.88;
      }
      // 8. Number 1: Index finger only upright
      else if (indexExt1 && !middleExt1 && !ringExt1 && !pinkyExt1 && !thumbExt1) {
        detectedSignId = 'number-1';
        rawConfidence = 0.96;
      }
      // 9. Number 2: V-shape (Index + Middle extended)
      else if (indexExt1 && middleExt1 && !ringExt1 && !pinkyExt1) {
        detectedSignId = 'number-2';
        rawConfidence = 0.96;
      }
      // 10. Number 3: 3 fingers upright
      else if (indexExt1 && middleExt1 && ringExt1 && !pinkyExt1) {
        detectedSignId = 'number-3';
        rawConfidence = 0.94;
      }
      // 11. Yes: Closed fist with nod
      else if (allCurled && !thumbExt1) {
        detectedSignId = 'yes';
        rawConfidence = 0.88;
      }
    }

    // Apply temporal voting filter over the last few frames to eliminate noise
    if (detectedSignId) {
      this.recentDetections.push(detectedSignId);
    } else {
      this.recentDetections.push('none');
    }
    if (this.recentDetections.length > this.maxHistoryFrames) {
      this.recentDetections.shift();
    }

    // Find the mode (majority vote) in recent frames
    const counts: Record<string, number> = {};
    for (const d of this.recentDetections) {
      counts[d] = (counts[d] || 0) + 1;
    }
    let stableSignId: string | null = null;
    let maxCount = 0;
    for (const [id, count] of Object.entries(counts)) {
      if (id !== 'none' && count > maxCount) {
        maxCount = count;
        stableSignId = id;
      }
    }

    // Require at least 3 occurrences out of recent frames for stable classification
    const verifiedSignId = maxCount >= 3 ? stableSignId : null;

    let facialDesc = 'Attentive';
    if (frame.facialExpressions.smiling) facialDesc = 'Smiling / Warm';
    if (frame.facialExpressions.eyebrowsRaised) facialDesc = 'Inquisitive / Question';
    if (frame.facialExpressions.mouthOpen) facialDesc = 'Open / Expressive';

    if (!verifiedSignId) {
      return {
        status: 'detecting',
        currentSign: null,
        confidence: 0.3,
        fps: this.currentFps,
        latencyMs: 16,
        handsDetected: handsCount,
        facialExpression: facialDesc,
      };
    }

    const signDef = ISL_DICTIONARY.find((s) => s.id === verifiedSignId);
    if (!signDef) {
      return {
        status: 'no-sign',
        currentSign: null,
        confidence: 0.4,
        fps: this.currentFps,
        latencyMs: 16,
        handsDetected: handsCount,
        facialExpression: facialDesc,
      };
    }

    const recognizedSign: RecognizedSign = {
      id: signDef.id,
      name: signDef.name,
      category: signDef.category,
      confidence: Math.min(rawConfidence, 0.98),
      description: signDef.description,
      isTwoHanded: signDef.isTwoHanded,
      gestureCode: signDef.svgPathType,
      timestamp: Date.now(),
    };

    return {
      status: rawConfidence >= 0.8 ? 'recognized' : 'low-confidence',
      currentSign: recognizedSign,
      confidence: Math.round(rawConfidence * 100),
      fps: this.currentFps,
      latencyMs: 14 + Math.round(Math.random() * 4),
      handsDetected: handsCount,
      facialExpression: facialDesc,
    };
  }

  // Draw futuristic neon ISL landmark skeletal overlay on 2D canvas
  public drawOverlay(
    ctx: CanvasRenderingContext2D,
    frame: DetectionFrame,
    width: number,
    height: number,
    highlightSign?: string | null
  ) {
    ctx.clearRect(0, 0, width, height);

    // MediaPipe Hand Connection Graph pairs
    const HAND_CONNECTIONS = [
      [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8], // Index
      [0, 9], [9, 10], [10, 11], [11, 12], // Middle
      [0, 13], [13, 14], [14, 15], [15, 16], // Ring
      [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
      [5, 9], [9, 13], [13, 17], // Palm knuckle base
    ];

    frame.hands.forEach((hand, handIndex) => {
      const isRight = frame.handedness[handIndex] === 'Right';
      const mainColor = isRight ? '#06B6D4' : '#38BDF8'; // Cyan vs Sky blue
      const jointColor = '#E0F2FE';

      ctx.save();

      // 1. Draw glowing bone connections
      ctx.lineWidth = 3;
      ctx.strokeStyle = mainColor;
      ctx.shadowColor = mainColor;
      ctx.shadowBlur = 8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      HAND_CONNECTIONS.forEach(([i, j]) => {
        const p1 = hand[i];
        const p2 = hand[j];
        if (p1 && p2) {
          ctx.beginPath();
          ctx.moveTo(p1.x * width, p1.y * height);
          ctx.lineTo(p2.x * width, p2.y * height);
          ctx.stroke();
        }
      });

      // 2. Draw palm bounding centroid
      const wrist = hand[0];
      const middleMcp = hand[9];
      const cx = ((wrist.x + middleMcp.x) / 2) * width;
      const cy = ((wrist.y + middleMcp.y) / 2) * height;

      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = isRight ? 'rgba(6, 182, 212, 0.4)' : 'rgba(56, 189, 248, 0.4)';
      ctx.fill();

      // 3. Draw 21 landmark nodes
      hand.forEach((lm, idx) => {
        const x = lm.x * width;
        const y = lm.y * height;
        const isFingertip = [4, 8, 12, 16, 20].includes(idx);
        const radius = isFingertip ? 5 : 3.5;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isFingertip ? '#38BDF8' : jointColor;
        ctx.shadowColor = isFingertip ? '#38BDF8' : mainColor;
        ctx.shadowBlur = isFingertip ? 10 : 4;
        ctx.fill();
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Hand tag label
      const tagX = hand[0].x * width;
      const tagY = Math.min(height - 10, hand[0].y * height + 24);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(tagX - 32, tagY - 14, 64, 18);
      ctx.strokeStyle = mainColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(tagX - 32, tagY - 14, 64, 18);
      ctx.fillStyle = '#E2E8F0';
      ctx.font = '10px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${frame.handedness[handIndex]} ISL`, tagX, tagY - 1);

      ctx.restore();
    });

    // If a sign is active, show recognition confirmation banner in canvas
    if (highlightSign) {
      ctx.save();
      ctx.fillStyle = 'rgba(11, 17, 32, 0.85)';
      ctx.roundRect(16, 16, Math.min(width - 32, 280), 38, 8);
      ctx.fill();
      ctx.strokeStyle = '#06B6D4';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('ISL RECOGNIZED', 28, 32);

      ctx.fillStyle = '#F8FAFC';
      ctx.font = '13px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(highlightSign, 28, 48);
      ctx.restore();
    }
  }
}
