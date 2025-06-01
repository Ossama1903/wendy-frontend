import { PERSONALITIES } from "@/lib/personalities";
import { AccessToken, AccessTokenOptions, VideoGrant } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

export const revalidate = 0;

export type PersonalityConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
  personalityId: string;
  personalityName: string;
};

export async function POST(request: NextRequest) {
  try {
    if (LIVEKIT_URL === undefined) {
      throw new Error("LIVEKIT_URL is not defined");
    }
    if (API_KEY === undefined) {
      throw new Error("LIVEKIT_API_KEY is not defined");
    }
    if (API_SECRET === undefined) {
      throw new Error("LIVEKIT_API_SECRET is not defined");
    }

    const body = await request.json();
    const { personalityId } = body;

    if (!personalityId) {
      return new NextResponse("Personality ID is required", { status: 400 });
    }

    const selectedPersonality = PERSONALITIES.find(p => p.id === personalityId);
    if (!selectedPersonality) {
      return new NextResponse("Invalid personality ID", { status: 400 });
    }

    // Generate participant token
    const participantIdentity = `user_${Math.floor(Math.random() * 10_000)}`;
    const roomName = `personality_room_${personalityId}_${Math.floor(Math.random() * 10_000)}`;
    const participantToken = await createParticipantToken(
      { identity: participantIdentity },
      roomName
    );

    // Return connection details with personality info
    const data: PersonalityConnectionDetails = {
      serverUrl: LIVEKIT_URL,
      roomName,
      participantToken: participantToken,
      participantName: participantIdentity,
      personalityId: selectedPersonality.id,
      personalityName: selectedPersonality.name,
    };

    const headers = new Headers({
      "Cache-Control": "no-store",
    });
    return NextResponse.json(data, { headers });
  } catch (error) {
    console.error("Error creating personality connection:", error);
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse("Internal server error", { status: 500 });
  }
}

function createParticipantToken(userInfo: AccessTokenOptions, roomName: string) {
  const at = new AccessToken(API_KEY, API_SECRET, {
    ...userInfo,
    ttl: "15m",
  });
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };
  at.addGrant(grant);
  return at.toJwt();
}
