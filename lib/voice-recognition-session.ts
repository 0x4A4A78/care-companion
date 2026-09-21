export type RecognitionTermination = "natural" | "error" | "cancelled";

export type RecognitionEndAction = "process" | "no-speech" | "ignore";

export function getRecognitionEndAction(
  termination: RecognitionTermination,
  transcript: string,
): RecognitionEndAction {
  if (termination !== "natural") return "ignore";
  return transcript.trim() ? "process" : "no-speech";
}
