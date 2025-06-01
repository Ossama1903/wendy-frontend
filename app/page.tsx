"use client";

import { CloseIcon } from "@/components/CloseIcon";
import { NoAgentNotification } from "@/components/NoAgentNotification";
import TranscriptionView from "@/components/TranscriptionView";
import PersonalitySelector from "@/components/PersonalitySelector";
import EvaluationDisplay from "@/components/EvaluationDisplay";
import { type Personality } from "@/lib/personalities";
import useCombinedTranscriptions from "@/hooks/useCombinedTranscriptions";
import {
  BarVisualizer,
  DisconnectButton,
  RoomAudioRenderer,
  RoomContext,
  VideoTrack,
  VoiceAssistantControlBar,
  useVoiceAssistant,
} from "@livekit/components-react";
import { AnimatePresence, motion } from "framer-motion";
import { Room, RoomEvent } from "livekit-client";
import { useCallback, useEffect, useState } from "react";
import * as React from "react";
import type { ConnectionDetails } from "./api/connection-details/route";
import type { PersonalityConnectionDetails } from "./api/personality-connection/route";

type AppState = "selecting" | "connecting" | "connected" | "evaluating";

export default function Page() {
  const [room] = useState(new Room());
  const [appState, setAppState] = useState<AppState>("selecting");
  const [selectedPersonality, setSelectedPersonality] = useState<Personality | null>(null);
  const [evaluation, setEvaluation] = useState<string>("");

  const onPersonalitySelect = useCallback(async (personality: Personality) => {
    setSelectedPersonality(personality);
    setAppState("connecting");
    
    try {
      const response = await fetch("/api/personality-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ personalityId: personality.id }),
      });
      
      const connectionDetailsData: PersonalityConnectionDetails = await response.json();
      
      await room.connect(connectionDetailsData.serverUrl, connectionDetailsData.participantToken);
      await room.localParticipant.setMicrophoneEnabled(true);
      setAppState("connected");
    } catch (error) {
      console.error("Failed to connect:", error);
      setAppState("selecting");
    }
  }, [room]);

  const onEndConversation = useCallback(async () => {
    if (!selectedPersonality) return;
    
    // Disconnect from room
    await room.disconnect();
    
    // Get evaluation (simple prompt to same LLM)
    setAppState("evaluating");
    try {
      const response = await fetch("/api/evaluation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalityUsed: selectedPersonality.name,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const { evaluation } = await response.json();
      setEvaluation(evaluation);
    } catch (error) {
      console.error("Failed to get evaluation:", error);
      setEvaluation("Sorry, I couldn't generate an evaluation at this time. Please try again.");
    }
  }, [room, selectedPersonality]);

  const onNewConversation = useCallback(() => {
    setAppState("connecting");
    // Trigger new conversation with same personality
    if (selectedPersonality) {
      onPersonalitySelect(selectedPersonality);
    }
  }, [selectedPersonality, onPersonalitySelect]);

  const onBackToSelection = useCallback(() => {
    setAppState("selecting");
    setSelectedPersonality(null);
    setEvaluation("");
  }, []);

  useEffect(() => {
    room.on(RoomEvent.MediaDevicesError, onDeviceFailure);
    room.on(RoomEvent.Disconnected, () => {
      if (appState === "connected") {
        // If we're still in connected state when room disconnects, go to evaluation
        onEndConversation();
      }
    });

    return () => {
      room.off(RoomEvent.MediaDevicesError, onDeviceFailure);
      room.off(RoomEvent.Disconnected, onEndConversation);
    };
  }, [room, appState, onEndConversation]);

    return (
    <main data-lk-theme="default" className="h-full grid content-center bg-[var(--lk-bg)]">
      <RoomContext.Provider value={room}>
        <div className="lk-room-container max-w-[1024px] w-[90vw] mx-auto max-h-[90vh]">
          <AnimatePresence mode="wait">
            {appState === "selecting" && (
              <PersonalitySelector
                onPersonalitySelect={onPersonalitySelect}
                onCancel={() => {}} // No cancel needed in this context
              />
            )}
            {(appState === "connecting" || appState === "connected") && (
              <SimpleVoiceAssistant 
                onEndConversation={onEndConversation}
                selectedPersonality={selectedPersonality}
                isConnecting={appState === "connecting"}
              />
            )}
            {appState === "evaluating" && (
              <EvaluationDisplay
                evaluation={evaluation}
                onNewConversation={onNewConversation}
                onBackToSelection={onBackToSelection}
              />
            )}
          </AnimatePresence>
        </div>
      </RoomContext.Provider>
    </main>
  );
}

function SimpleVoiceAssistant(props: { 
  onEndConversation: () => void;
  selectedPersonality: Personality | null;
  isConnecting: boolean;
}) {
  const { state: agentState } = useVoiceAssistant();

  if (props.isConnecting || agentState === "connecting") {
    return (
      <motion.div
        key="connecting"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.09, 1.04, 0.245, 1.055] }}
        className="grid items-center justify-center h-full"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">
            Connecting to {props.selectedPersonality?.name}...
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key="connected"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: [0.09, 1.04, 0.245, 1.055] }}
          className="flex flex-col items-center gap-4 h-full"
        >
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: props.selectedPersonality?.color || "#4F46E5" }}
            />
            <h2 className="text-white text-xl font-semibold">
              Chatting with {props.selectedPersonality?.name}
            </h2>
          </div>
          <AgentVisualizer />
          <div className="flex-1 w-full">
            <TranscriptionView />
          </div>
          <div className="w-full">
            <ControlBar onEndConversation={props.onEndConversation} />
          </div>
          <RoomAudioRenderer />
          <NoAgentNotification state={agentState} />
        </motion.div>
      </AnimatePresence>
    </>
  );
}

function AgentVisualizer() {
  const { state: agentState, videoTrack, audioTrack } = useVoiceAssistant();

  if (videoTrack) {
    return (
      <div className="h-[512px] w-[512px] rounded-lg overflow-hidden">
        <VideoTrack trackRef={videoTrack} />
      </div>
    );
  }
  return (
    <div className="h-[300px] w-full">
      <BarVisualizer
        state={agentState}
        barCount={5}
        trackRef={audioTrack}
        className="agent-visualizer"
        options={{ minHeight: 24 }}
      />
    </div>
  );
}

function ControlBar(props: { onEndConversation: () => void }) {
  const { state: agentState } = useVoiceAssistant();

  return (
    <div className="relative h-[60px]">
      <AnimatePresence>
        {agentState !== "disconnected" && agentState !== "connecting" && (
          <motion.div
            initial={{ opacity: 0, top: "10px" }}
            animate={{ opacity: 1, top: 0 }}
            exit={{ opacity: 0, top: "-10px" }}
            transition={{ duration: 0.4, ease: [0.09, 1.04, 0.245, 1.055] }}
            className="flex h-8 absolute left-1/2 -translate-x-1/2 justify-center gap-4"
          >
            <VoiceAssistantControlBar controls={{ leave: false }} />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              onClick={props.onEndConversation}
            >
              End & Evaluate
            </motion.button>
            <DisconnectButton>
              <CloseIcon />
            </DisconnectButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function onDeviceFailure(error: Error) {
  console.error(error);
  alert(
    "Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab"
  );
}
