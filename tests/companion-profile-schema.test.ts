import { describe, expect, it } from "vitest";

import { companionProfileSchema } from "../lib/companion-profile-schema";

const validProfile = {
  fullName: "คุณกานต์ ใจดี",
  serviceArea: "กรุงเทพมหานคร",
  bio: "มีประสบการณ์พาผู้สูงอายุไปโรงพยาบาล",
  experienceYears: 3,
  skills: ["พาไปโรงพยาบาล", "ช่วยงานเอกสาร"],
  languages: ["ภาษาไทย"],
  hourlyRate: 350,
  transportation: "รถยนต์ส่วนตัว",
  available: true,
};

describe("companion profile schema", () => {
  it("accepts a complete companion profile", () => {
    expect(companionProfileSchema.safeParse(validProfile).success).toBe(true);
  });

  it("rejects invalid experience and hourly rate", () => {
    expect(companionProfileSchema.safeParse({
      ...validProfile,
      experienceYears: 61,
      hourlyRate: -1,
    }).success).toBe(false);
  });

  it("normalizes duplicate and blank skills", () => {
    const result = companionProfileSchema.parse({
      ...validProfile,
      skills: [" พาไปโรงพยาบาล ", "", "พาไปโรงพยาบาล"],
    });

    expect(result.skills).toEqual(["พาไปโรงพยาบาล"]);
  });
});
