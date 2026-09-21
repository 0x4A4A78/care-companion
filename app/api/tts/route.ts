import { NextRequest, NextResponse } from "next/server";
import { tts } from "edge-tts";

/**
 * POST /api/tts
 * Body: { text: string }
 * Returns: audio/mpeg binary (MP3)
 *
 * ใช้เสียง Microsoft Edge Neural TTS — เสียง "PremwadeeNeural"
 * เป็นเสียงผู้หญิงไทยคุณภาพสูง ฟังชัดเจนเป็นธรรมชาติ ฟรี 100%
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = body?.text?.trim();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "กรุณาระบุข้อความที่ต้องการให้พูด" },
        { status: 400 },
      );
    }

    // จำกัดความยาวป้องกัน abuse
    if (text.length > 500) {
      return NextResponse.json(
        { error: "ข้อความยาวเกินไป (สูงสุด 500 ตัวอักษร)" },
        { status: 400 },
      );
    }

    const audioBuffer = await tts(text, {
      voice: "th-TH-PremwadeeNeural", // เสียงผู้หญิงไทย Neural คุณภาพสูง
      rate: "-8%",   // ช้าลงเล็กน้อยให้ผู้สูงอายุฟังทัน
      pitch: "+0Hz",  // เสียงปกติ
      volume: "+0%",  // ดังปกติ
    });

    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (err) {
    console.error("[TTS] Error:", err);
    return NextResponse.json(
      { error: "ไม่สามารถสร้างเสียงพูดได้ในขณะนี้" },
      { status: 500 },
    );
  }
}
