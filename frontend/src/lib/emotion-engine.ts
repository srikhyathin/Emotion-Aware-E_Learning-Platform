/**
 * EmotionSense Emotion Recognition Engine
 * Handles client-side facial landmark processing and emotion classification.
 * Uses MediaPipe FaceMesh for landmark extraction.
 */

import * as faceapi from '@vladmandic/face-api';

export interface EmotionResult {
  engagement: number;
  confusion: number;
  boredom: number;
  frustration: number;
  surprise: number;
  happiness: number;
  sadness: number;
  anger: number;
}

export class EmotionEngine {
  /**
   * Classifies emotions mapping face-api native expressions to our educational metrics.
   * expressions: { neutral, happy, sad, angry, fearful, disgusted, surprised }
   */
  static classifyFromExpressions(expressions: faceapi.FaceExpressions): EmotionResult {
    const { neutral, happy, sad, angry, fearful, disgusted, surprised } = expressions;

    return {
      engagement: Math.min(1, neutral * 0.9 + happy * 0.5), 
      happiness: happy,
      surprise: surprised,
      boredom: Math.min(1, sad * 0.6 + neutral * 0.2), // Sad/low energy often reads as boredom
      frustration: Math.min(1, angry + disgusted * 0.8), 
      confusion: Math.min(1, fearful + disgusted * 0.5), 
      sadness: sad,
      anger: angry
    };
  }

  /**
   * Returns a natural language label for the dominant emotion.
   */
  static getPrimaryEmotion(emotions: EmotionResult): string {
    const entries = Object.entries(emotions);
    const dominant = entries.reduce((a, b) => a[1] > b[1] ? a : b);
    
    if (dominant[1] < 0.25) return "Neutral";
    
    const labels: Record<string, string> = {
      engagement: "Highly Focused",
      confusion: "Needs Help",
      boredom: "Uninterested",
      frustration: "Struggling",
      surprise: "Astonished",
      happiness: "Happy & Engaged",
      sadness: "Disheartened",
      anger: "Blocked/Frustrated"
    };

    return labels[dominant[0]] || "Neutral";
  }
}
