export interface HandLandmark {
  x: number;
  y: number;
  z?: number;
}

export type HandLandmarks = HandLandmark[]; // 21 landmarks

export interface RecognizedSign {
  id: string;
  name: string;
  category: 'greeting' | 'emergency' | 'needs' | 'conversation' | 'alphabet' | 'number';
  confidence: number;
  description: string;
  isTwoHanded?: boolean;
  gestureCode: string;
  timestamp: number;
}

export interface ISLSignDefinition {
  id: string;
  name: string;
  category: 'greeting' | 'emergency' | 'needs' | 'conversation' | 'alphabet' | 'number';
  description: string;
  meaning: string;
  isTwoHanded: boolean;
  instructions: string[];
  tips: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  svgPathType: string;
}

export interface FaceExpressions {
  mouthOpen: boolean;
  smiling: boolean;
  eyebrowsRaised: boolean;
}

export interface RecognitionState {
  status: 'idle' | 'initializing' | 'detecting' | 'recognized' | 'low-confidence' | 'no-sign';
  currentSign: RecognizedSign | null;
  confidence: number;
  fps: number;
  latencyMs: number;
  handsDetected: number;
  facialExpression: string;
}
