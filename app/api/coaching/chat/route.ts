import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Mock AI Coaching API route — Week 3 deliverable.
 *
 * In production, replace with actual AI API call (OpenAI / Anthropic).
 * The system prompt includes the user's genetic context for personalized answers.
 *
 * Streaming is implemented using ReadableStream so the frontend can
 * display responses token-by-token for a natural feel.
 */

// Mock coach responses — simulates what an AI trained on peptide/genomics would say
function buildSystemPrompt(userContext: Record<string, unknown>): string {
  return `You are HelixForge AI Coach, a knowledgeable assistant specializing in peptide therapy optimization, genetic nutrition, and evidence-based strength training.

Your guidance is for educational purposes only. Always remind users to consult their licensed physician before making changes to their health protocol.

User context:
${JSON.stringify(userContext, null, 2)}

Be specific, cite mechanisms of action, and reference the user's genetic profile when relevant.`;
}

const MOCK_RESPONSES: string[] = [
  `Great question about BPC-157 and training integration!

Based on your BDKB2 variant (rs8017985), you show heightened peptide sensitivity — this means you may respond exceptionally well to lower BPC-157 doses compared to the standard protocol.

**Recommended approach for training days:**
- Inject BPC-157 subcutaneously near the target tissue 30-60 minutes BEFORE training
- Your sensitivity profile suggests 250-350mcg may be optimal (not the typical 500mcg)
- The TB-500 you stack with it works synergistically on cell migration pathways

**Important:** Given your MTHFR variant (slow methylation), ensure you're taking methylated B-complex vitamins alongside your peptide protocol. Non-methylated B-vitamins may not be efficiently utilized by your biochemistry.

Always coordinate dosing with your physician.`,
  `Your ACTN3 + ACE genetic profile is fascinating for programming purposes!

**Power-endurance hybrid typing** means you have both fast-twitch dominance (ACTN3) and endurance-favoring ACE expression. This is actually ideal for compound lifting progression.

**Training recommendation:**
- Your power ceiling is high — prioritize compound movements (squat, deadlift, bench)
- Volume tolerance may be slightly reduced vs pure endurance types
- Accumulation/intensity undulating periodization aligns well with your genes

**Peptide timing on training days:**
BPC-157 30-60 min pre-workout on your heavy days (weeks 1-4)
TB-500 on recovery days

Shall I break down your 90-day periodization based on this genetic profile?`,
];

function getMockResponse(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes("bpc") || msg.includes("training") || msg.includes("dose")) {
    return MOCK_RESPONSES[0];
  }
  if (msg.includes("actn3") || msg.includes("ace") || msg.includes("training") || msg.includes("program")) {
    return MOCK_RESPONSES[1];
  }
  return `Thanks for your question!

To give you the most accurate guidance, I'll need to reference your specific genetic profile. Your BDKB2 sensitivity mapping and MTHFR methylation status are particularly relevant here.

**For your current protocol phase (Foundation Weeks 1-4):**

The priority is ensuring your body has the foundational support for peptide pathway activation. This means:
1. Adequate protein intake (1.8-2.2g/kg lean mass)
2. Methylated B-vitamins if MTHFR variant is present
3. Consistent sleep (7-9 hours — critical for tissue repair)

When you're ready to discuss specific peptide stacking, training periodization, or nutrition timing, just ask!

*Note: All protocol changes should be discussed with your physician.*`;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { message } = body as {
      message: string;
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Load user context from Supabase (protocol, gene variants)
    let userContext: Record<string, unknown> = {};
    try {
      const supabase = createServiceRoleClient();
      const { data: protocol } = await supabase
        .from("protocols")
        .select("signal_kit_report")
        .eq("user_id", userId)
        .single();

      if (protocol?.signal_kit_report) {
        userContext = protocol.signal_kit_report as Record<string, unknown>;
      }
    } catch {
      // Non-fatal — proceed without user context
    }

    const _systemPrompt = buildSystemPrompt(userContext);

    // In production: stream from OpenAI/Anthropic
    // const response = await openai.chat.completions.create({
    //   model: "gpt-4o",
    //   messages: [{ role: "system", content: systemPrompt }, ...history, { role: "user", content: message }],
    //   stream: true,
    // });
    // return new Response(response.toReadableStream(), { headers: { 'Content-Type': 'text/event-stream' } });

    // Mock streaming response — simulates token-by-token output
    const mockText = getMockResponse(message);
    const fullResponse = `${mockText}\n\n---\n*AI Coach response · Verify all protocol changes with your licensed physician*`;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

        // Stream word by word for natural feel
        const words = fullResponse.split(" ");
        for (let i = 0; i < words.length; i++) {
          controller.enqueue(encoder.encode(words[i] + (i < words.length - 1 ? " " : "")));
          await delay(18 + Math.random() * 12); // 18-30ms per word
        }
        controller.close();
      },
    });

    // Also save the session to Supabase (fire-and-forget)
    createServiceRoleClient()
      .from("coaching_sessions")
      .insert({
        user_id: userId,
        message,
        ai_response: { text: mockText },
        created_at: new Date().toISOString(),
      })
      .then(({ error }) => {
        if (error) console.warn("[coaching/chat] Session save failed:", error);
      });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("[coaching/chat]", err);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
