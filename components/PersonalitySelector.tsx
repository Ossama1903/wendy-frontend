"use client";

import { PERSONALITIES, type Personality } from "@/lib/personalities";
import { motion } from "framer-motion";
import { useState } from "react";

interface PersonalitySelectorProps {
  onPersonalitySelect: (personality: Personality) => void;
  onCancel: () => void;
}

export default function PersonalitySelector({ onPersonalitySelect, onCancel }: PersonalitySelectorProps) {
  const [selectedPersonality, setSelectedPersonality] = useState<Personality | null>(null);

  const handleConfirm = () => {
    if (selectedPersonality) {
      onPersonalitySelect(selectedPersonality);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.09, 1.04, 0.245, 1.055] }}
      className="w-full max-w-4xl mx-auto p-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Choose Your Conversation Partner</h2>
        <p className="text-gray-300">Select a personality to practice your communication skills</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {PERSONALITIES.map((personality) => (
          <motion.div
            key={personality.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`cursor-pointer p-4 rounded-lg border-2 transition-all duration-200 ${
              selectedPersonality?.id === personality.id
                ? "border-white bg-white/10"
                : "border-gray-600 hover:border-gray-400 bg-gray-800/50"
            }`}
            onClick={() => setSelectedPersonality(personality)}
          >
            <div 
              className="w-4 h-4 rounded-full mb-3"
              style={{ backgroundColor: personality.color }}
            />
            <h3 className="text-xl font-semibold text-white mb-2">{personality.name}</h3>
            <p className="text-gray-300 text-sm leading-relaxed">{personality.description}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
          onClick={onCancel}
        >
          Cancel
        </motion.button>
        <motion.button
          whileHover={{ scale: selectedPersonality ? 1.05 : 1 }}
          whileTap={{ scale: selectedPersonality ? 0.95 : 1 }}
          className={`px-6 py-2 rounded-md transition-colors ${
            selectedPersonality
              ? "bg-white text-black hover:bg-gray-100"
              : "bg-gray-700 text-gray-400 cursor-not-allowed"
          }`}
          onClick={handleConfirm}
          disabled={!selectedPersonality}
        >
          Start Conversation
        </motion.button>
      </div>
    </motion.div>
  );
}
