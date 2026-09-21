import { NextRequest, NextResponse } from "next/server";

/**
 * GET & POST /api/tts
 * ให้บริการแปลงข้อความเป็นเสียงภาษาไทย (ผู้หญิง เสียงธรรมชาติ ฟังชัดเจน)
 * ผ่าน Google TTS Engine โดยไม่ต้องใช้ API key และไม่มีค่าใช้จ่าย
 */
async function fetchThaiSpeech(text: string): Promise<Response> {
  const cleanText = text.trim().slice(0, 200);
  const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
    cleanText,
  )}&tl=th&client=tw-ob`;

  return fetch(googleTtsUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      Referer: "https://translate.google.com/",
    },
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text")?.trim();

  if (!text) {
    return new NextResponse("Text parameter is required", { status: 400 });
  }

  try {
    const upstreamRes = await fetchThaiSpeech(text);

    if (!upstreamRes.ok) {
      return new NextResponse(`TTS service error: ${upstreamRes.status}`, {
        status: 502,
      });
    }

    const audioBuffer = await upstreamRes.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (err) {
    console.error("[TTS API Error]", err);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = typeof body?.text === "string" ? body.text.trim() : "";

    if (!text) {
      return NextResponse.json(
        { error: "Text is required in request body" },
        { status: 400 },
      );
    }

    const upstreamRes = await fetchThaiSpeech(text);

    if (!upstreamRes.ok) {
      return NextResponse.json(
        { error: `TTS service error: ${upstreamRes.status}` },
        { status: 502 },
      );
    }

    const audioBuffer = await upstreamRes.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (err) {
    console.error("[TTS API Error]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
