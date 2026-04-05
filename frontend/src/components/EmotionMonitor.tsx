"use client";

import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { EmotionEngine, EmotionResult } from '@/lib/emotion-engine';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Brain, AlertCircle } from 'lucide-react';

import * as faceapi from '@vladmandic/face-api';

interface EmotionMonitorProps {
  onEmotionUpdate: (emotions: EmotionResult) => void;
  showPreview?: boolean;
}

const EmotionMonitor: React.FC<EmotionMonitorProps> = ({ onEmotionUpdate, showPreview = true }) => {
  const webcamRef = useRef<Webcam>(null);
  const [emotions, setEmotions] = useState<EmotionResult | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState<string | null>(null);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    let active = true;

    const loadModels = async () => {
      try {
        // Load weights from standard public CDN for face-api
        const MODEL_URL = 'https://vladmandic.github.io/face-api/model/';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ]);

        const runFrame = async () => {
          if (!active) return;
          if (webcamRef.current?.video && webcamRef.current.video.readyState === 4) {
             const video = webcamRef.current.video;
             const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
             if (detections) {
                const classified = EmotionEngine.classifyFromExpressions(detections.expressions);
                setEmotions(classified);
                onEmotionUpdate(classified);
             }
          }
          // Request next frame continuously
          requestRef.current = requestAnimationFrame(runFrame);
        };

        requestRef.current = requestAnimationFrame(runFrame);
      } catch (err) {
        console.error("FaceAPI Init Error:", err);
      }
    };

    loadModels();

    return () => {
      active = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [onEmotionUpdate]);

  const handleUserMedia = () => {
    setIsReady(true);
    setHasError(null);
  };
  const handleUserMediaError = (err: any) => {
    console.error("Webcam Error:", err);
    setHasError(err.name === 'NotReadableError' ? 'Camera in use by another app' : 'Camera Access Denied');
  };

  return (
    <div className="relative group overflow-hidden rounded-[32px] bg-slate-900 border border-white/5 shadow-2xl min-h-[384px] flex flex-col">
      <div className="absolute top-6 left-6 z-20 flex items-center gap-3 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10">
        <div className={`w-2.5 h-2.5 rounded-full ${isReady ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'} animate-pulse`} />
        <span className="text-[10px] font-black text-white/90 tracking-[0.2em] uppercase">AI Optical Sensor</span>
      </div>

      <div 
        className={`${showPreview ? 'block' : 'hidden'} relative w-full overflow-hidden flex-1 bg-slate-950`}
        style={{ height: '100%' }}
      >
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          onUserMedia={handleUserMedia}
          onUserMediaError={handleUserMediaError}
          className="w-full h-full object-cover scale-x-[-1]"
          style={{ height: '100%', width: '100%', objectFit: 'cover' }}
          videoConstraints={{ facingMode: "user" }}
        />
      </div>

      {(!isReady || hasError) && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm p-10 text-center">
          {hasError ? (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
                <AlertCircle className="w-8 h-8 text-rose-500" />
              </div>
              <div className="space-y-1">
                <h4 className="text-white font-black uppercase text-xs tracking-widest">Optical Sensor Failure</h4>
                <p className="text-slate-400 text-[10px] font-bold leading-relaxed">{hasError}</p>
                <p className="text-slate-500 text-[9px] italic mt-2">Close other tabs or Zoom calls and refresh</p>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
              >
                Retry Sensor
              </button>
            </div>
          ) : (
            <>
              <Brain className="w-16 h-16 text-blue-500 animate-pulse opacity-20" />
              <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mt-4">Initializing AI Vision...</p>
            </>
          )}
        </div>
      )}

      {/* Real-time Emotional Intensity Overlay */}
      <AnimatePresence>
        {emotions && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex flex-col justify-end p-8 pointer-events-none"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-none">Dominant State</p>
                  <h4 className="text-2xl font-black text-white tracking-tight uppercase italic">{EmotionEngine.getPrimaryEmotion(emotions)}</h4>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Confidence</p>
                  <span className="text-sm font-black text-blue-500">{(Math.max(...Object.values(emotions).filter(v => typeof v === 'number')) * 100).toFixed(0)}%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                {Object.entries(emotions).filter(([k]) => ['confusion', 'frustration', 'boredom', 'engagement'].includes(k)).map(([key, val]) => (
                  <div key={key} className="bg-white/5 backdrop-blur-md p-3 rounded-2xl border border-white/5 space-y-1">
                    <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-slate-400">
                      <span>{key}</span>
                      <span className="text-white">{(val * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${val * 100}%` }}
                        className={`h-full ${val > 0.5 ? 'bg-blue-500' : 'bg-blue-500/30'}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmotionMonitor;
