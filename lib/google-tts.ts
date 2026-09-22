export type TtsVoice = {
  name: string;
  lang: string;
};

export function buildGoogleTtsUrl(text: string) {
  return `/api/tts?text=${encodeURIComponent(text.trim())}`;
}

export function findPreferredThaiVoice<T extends TtsVoice>(voices: readonly T[]): T | null {
  const thaiVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith("th"));
  return (
    thaiVoices.find((voice) => voice.name.toLowerCase().includes("google"))
    ?? thaiVoices[0]
    ?? null
  );
}
