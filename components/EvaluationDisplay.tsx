"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface EvaluationDisplayProps {
  evaluation: string;
  onNewConversation: () => void;
  onBackToSelection: () => void;
}

export default function EvaluationDisplay({ 
  evaluation, 
  onNewConversation, 
  onBackToSelection 
}: EvaluationDisplayProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechUtterance, setSpeechUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  const playEvaluation = () => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(evaluation);
      
      // Ensure voices are loaded
      const loadVoicesAndSpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        const youngAmericanVoice = voices.find(voice => 
          (voice.lang.includes('en-US') || voice.lang.includes('en-GB')) &&
          (voice.name.toLowerCase().includes('samantha') ||
           voice.name.toLowerCase().includes('karen') ||
           voice.name.toLowerCase().includes('zira') ||
           voice.name.toLowerCase().includes('susan') ||
           voice.name.toLowerCase().includes('female') ||
           voice.name.toLowerCase().includes('woman'))
        ) || voices.find(voice => voice.lang.startsWith('en-US')) || voices[0];
        
        if (youngAmericanVoice) {
          utterance.voice = youngAmericanVoice;
        }
        
        utterance.rate = 1.1; // Slightly faster for younger sound
        utterance.pitch = 1.2; // Higher pitch for younger woman
        utterance.volume = 1;
        
        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        
        setSpeechUtterance(utterance);
        window.speechSynthesis.speak(utterance);
      };

      // Wait for voices to load if they haven't already
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.addEventListener('voiceschanged', loadVoicesAndSpeak, { once: true });
      } else {
        loadVoicesAndSpeak();
      }
    }
  };

  // Clean up speech on component unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    setDisplayedText("");
    setIsTyping(true);
    
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < evaluation.length) {
        setDisplayedText(evaluation.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(typingInterval);
        // Auto-play evaluation when typing is complete
        setTimeout(() => {
          playEvaluation();
        }, 500); // Small delay after typing completes
      }
    }, 30);

    return () => clearInterval(typingInterval);
  }, [evaluation]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.09, 1.04, 0.245, 1.055] }}
      className="w-full max-w-4xl mx-auto p-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Performance Evaluation</h2>
        <p className="text-gray-300">Here's your feedback from Wendy Rhoades</p>
      </div>

      <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-lg">WR</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">Wendy Rhoades - Performance Coach</h3>
              {isPlaying && (
                <div className="flex items-center text-green-400 text-sm">
                  <span className="mr-2">🔊</span>
                  <span className="animate-pulse">Speaking...</span>
                </div>
              )}
            </div>
            <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
              {displayedText}
              {isTyping && (
                <span className="inline-block w-2 h-5 bg-white ml-1 animate-pulse" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
          onClick={onBackToSelection}
        >
          Choose New Personality
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-2 bg-white text-black rounded-md hover:bg-gray-100 transition-colors"
          onClick={onNewConversation}
        >
          Practice Again
        </motion.button>
      </div>
    </motion.div>
  );
}
