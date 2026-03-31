import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * AI Coaching API route — streams real OpenAI responses token-by-token.
 *
 * System prompt is built from the user's genetic profile stored in Supabase,
 * making responses personalized to their specific gene variants and protocol phase.
 *
 * Streaming via ReadableStream ensures the frontend displays tokens as they arrive,
 * giving a natural conversational feel rather than waiting for the full response.
 */

function buildSystemPrompt(userContext: Record<string, unknown>): string {
  return `You are HelixForge AI Coach, a knowledgeable assistant specializing in peptide therapy optimization, genetic nutrition, and evidence-based strength training.

Your guidance is for educational purposes only. Always remind users to consult their licensed physician before making changes to their health protocol.

User genetic/protocol context:
${Object.keys(userContext).length > 0 ? JSON.stringify(userContext, null, 2) : "No genetic profile uploaded yet."}

Be specific, cite mechanisms of action, and reference the user's genetic profile when relevant.`;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { message } = body as { message: string };

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (message.length > 2000) {
      return NextResponse.json({ error: "Message too long (max 2000 chars)" }, { status: 400 });
    }

    // Load user context from Supabase (genetic profile, protocol phase)
    let userContext: Record<string, unknown> = {};
    try {
      const supabase = createServiceRoleClient();
      const { data: protocol } = await supabase
        .from("protocols")
        .select("signal_kit_report, phase, status")
        .eq("user_id", userId)
        .maybeSingle();

      if (protocol) {
        userContext = {
          ...(protocol.signal_kit_report as Record<string, unknown> ?? {}),
          protocol_phase: protocol.phase,
          protocol_status: protocol.status,
        };
      }
    } catch {
      // Non-fatal — proceed without user context
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Fall back to graceful error rather than crashing
      return NextResponse.json(
        { error: "AI coaching not configured. Set OPENAI_API_KEY in environment." },
        { status: 503 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: buildSystemPrompt(userContext) },
        { role: "user", content: message },
      ],
      stream: true,
      max_tokens: 800,
      temperature: 0.7,
    });

    // Convert OpenAI streaming to Web Streams API (Next.js compatible)
    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? "";
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    // Save the session to Supabase asynchronously (fire-and-forget)
    const sessionText = message; // capture for closure
    createServiceRoleClient()
      .from("coaching_sessions")
      .insert({
        user_id: userId,
        message: sessionText,
        ai_response: { model: "gpt-4o-mini", streamed: true },
      })
      .then(({ error }) => {
        if (error) console.warn("[coaching/chat] Session save failed:", error.message);
      });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("[coaching/chat]", err);
    const message = err instanceof Error ? err.message : "Chat failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
