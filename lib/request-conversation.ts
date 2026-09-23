import { parseVoiceIntent } from "./parse-voice-intent";

export type ConversationStep =
  | "category"
  | "datetime"
  | "pickup"
  | "destination"
  | "duration"
  | "support"
  | "notes"
  | "review";

export function formatTime24HourInput(value: string) {
  const cleaned = value.replace(/[^\d:]/g, "");
  if (cleaned.includes(":")) {
    const [hours = "", minutes = ""] = cleaned.split(":");
    return `${hours.slice(0, 2)}:${minutes.replace(/:/g, "").slice(0, 2)}`;
  }

  const digits = cleaned.slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
}

export function isValidTime24Hour(value: string) {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export type VoicePatch = Partial<{
  category: "hospital" | "bank" | "government" | "shopping" | "other";
  serviceDate: string;
  startTime: string;
  pickup: string;
  destination: string;
  durationHours: number;
  supportNeeds: string[];
  notes: string;
}>;

export function getConversationVoicePatch(step: ConversationStep, transcript: string): VoicePatch {
  const text = transcript.trim();
  if (!text) return {};
  const intent = parseVoiceIntent(text);

  switch (step) {
    case "category":
      return intent.category ? { category: intent.category } : {};
    case "datetime":
      return {
        ...(intent.serviceDate ? { serviceDate: intent.serviceDate } : {}),
        ...(intent.startTime ? { startTime: intent.startTime } : {}),
      };
    case "pickup":
      return { pickup: text };
    case "destination":
      return { destination: intent.destination ?? text };
    case "duration": {
      const value = Number(text.match(/\d+(?:\.\d+)?/)?.[0]);
      return value >= 0.5 && value <= 12 ? { durationHours: value } : {};
    }
    case "support":
      return intent.supportNeeds?.length ? { supportNeeds: intent.supportNeeds } : {};
    case "notes":
      return { notes: text };
    default:
      return {};
  }
}
