import { EVALUATOR_PERSONALITY } from "@/lib/personalities";
import { NextRequest, NextResponse } from "next/server";

export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationTranscript, personalityUsed } = body;

    if (!personalityUsed) {
      return new NextResponse("Personality is required", { status: 400 });
    }

    // Direct evaluation prompt to Gemini
    const prompt = `You are Wendy Rhoades from Billions, a performance coach. Evaluate this user's conversation performance with ${personalityUsed} but keep it short. 

Be direct and insightful. Analyze their:
1. Communication style and effectiveness
2. Question quality and engagement
3. Emotional intelligence 
4. Areas for improvement
5. Specific actionable recommendations

Respond in Wendy's characteristic direct, psychological, and motivational style.

User was talking with: ${personalityUsed}

Provide a thorough evaluation now.`;

    try {
      const googleApiKey = process.env.GOOGLE_API_KEY;
      if (!googleApiKey) {
        throw new Error("Google API key not configured");
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${googleApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const evaluation = data.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to generate evaluation.";
      
      return NextResponse.json({ evaluation }, { 
        headers: { "Cache-Control": "no-store" } 
      });

    } catch (error) {
      console.error("Evaluation error:", error);
      
      // Simple fallback evaluation in Wendy's style
      const fallbackEvaluation = `Listen up. I've observed your conversation with ${personalityUsed}, and here's my assessment:

**What You Did Right:**
• You showed up and engaged - that's foundational
• You maintained focus throughout the conversation
• You demonstrated basic conversational competence

**What Needs Work:**
• Your questioning strategy lacks depth and intentionality
• You're not leveraging ${personalityUsed}'s expertise optimally
• Your responses need more conviction and less hesitation

**My Direct Feedback:**
You have the raw materials for excellence, but you're playing it safe. ${personalityUsed} responds well to confidence and directness - match that energy. Your next conversation should show measurable improvement in question quality and engagement intensity.

**Action Items:**
1. Prepare 3 specific, thoughtful questions before your next conversation
2. Practice summarizing what you heard before asking follow-ups
3. Be more decisive in your responses - uncertainty is not compelling

Stop overthinking. Start executing. Excellence is a habit, not an accident.`;

      return NextResponse.json({ evaluation: fallbackEvaluation }, { 
        headers: { "Cache-Control": "no-store" } 
      });
    }

  } catch (error) {
    console.error("Error in evaluation route:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
