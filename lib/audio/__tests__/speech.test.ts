import { describe, expect, test } from "bun:test";
import { pickBestVoice, type VoiceCandidate } from "../speech";

const MOCK_VOICES: VoiceCandidate[] = [
  { name: "Thai Default", lang: "th-TH" },
  { name: "Microsoft David - English (United States)", lang: "en-US" },
  { name: "Google US English", lang: "en-US" },
  { name: "Microsoft Libby Online (Natural) - English (United Kingdom)", lang: "en-GB" },
  { name: "Google UK English Female", lang: "en-GB" },
];

describe("speech voice selection", () => {
  test("prefers Natural/Google voice matching requested UK accent", () => {
    const picked = pickBestVoice(MOCK_VOICES, "en-GB");
    expect(picked?.lang).toBe("en-GB");
    expect(picked?.name).toContain("Natural");
  });

  test("prefers Google voice matching requested US accent", () => {
    const picked = pickBestVoice(MOCK_VOICES, "en-US");
    expect(picked?.lang).toBe("en-US");
    expect(picked?.name).toContain("Google");
  });

  test("falls back to any English voice when exact locale is unavailable", () => {
    const picked = pickBestVoice([{ name: "Thai", lang: "th-TH" }, { name: "AU", lang: "en-AU" }], "en-GB");
    expect(picked?.lang).toBe("en-AU");
  });

  test("returns undefined when no English voice exists", () => {
    expect(pickBestVoice([{ name: "Thai", lang: "th-TH" }], "en-GB")).toBeUndefined();
    expect(pickBestVoice([], "en-US")).toBeUndefined();
  });
});
