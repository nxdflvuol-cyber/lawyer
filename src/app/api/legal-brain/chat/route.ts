import { NextResponse } from "next/server";
import { runLegalBrain } from "@/lib/legal-brain/brain";
import type { BrainInput } from "@/lib/legal-brain/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const input: BrainInput = {
      message: body.message ?? "",
      userId: body.userId,
      sessionId: body.sessionId ?? "brain-default",
      history: body.history ?? [],
      explicit_context: body.context ?? {},
    };

    if (!input.message.trim()) {
      return NextResponse.json(
        { success: false, error: "الرسالة فارغة" },
        { status: 400 }
      );
    }

    const response = await runLegalBrain(input);

    return NextResponse.json({ success: true, response });
  } catch (error) {
    console.error("Legal Brain error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "خطأ في العقل القانوني",
      },
      { status: 500 }
    );
  }
}
