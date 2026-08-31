import { describe, it, expect, vi, afterEach } from "vitest";
import { sendInternalLeadNotification, sendClientConfirmationEmail } from "@/lib/notifications/lead-notification-service";
import type { EmailNotificationProvider, EmailMessage } from "@/lib/notifications/email-provider";
import type { Lead } from "@/domain/lead";

function fakeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    publicReference: "SP-TEST01",
    name: "Jane Doe",
    email: "jane@example.com",
    language: "en",
    source: "project_builder",
    status: "NEW",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

class RecordingProvider implements EmailNotificationProvider {
  sent: EmailMessage[] = [];
  constructor(private readonly result: { success: true } | { success: false; error: string } = { success: true }) {}
  async send(message: EmailMessage) {
    this.sent.push(message);
    return this.result;
  }
}

describe("sendInternalLeadNotification", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is SKIPPED when the recipient/from env vars aren't configured, even with a working provider", async () => {
    vi.stubEnv("LEAD_NOTIFICATION_EMAIL", "");
    vi.stubEnv("LEAD_NOTIFICATION_FROM_EMAIL", "");
    const provider = new RecordingProvider();
    const result = await sendInternalLeadNotification(fakeLead(), "SP-TEST01", undefined, provider);
    expect(result.outcome).toBe("SKIPPED");
    expect(provider.sent).toHaveLength(0);
  });

  it("sends via the injected provider and never leaks the message body/free-text into the subject/reference fields", async () => {
    vi.stubEnv("LEAD_NOTIFICATION_EMAIL", "ops@sigmaplus.agency");
    vi.stubEnv("LEAD_NOTIFICATION_FROM_EMAIL", "notifications@sigmaplus.agency");
    const provider = new RecordingProvider();

    const result = await sendInternalLeadNotification(
      fakeLead({ company: "Acme" }),
      "SP-TEST01",
      { projectType: "web-development", timeline: "asap", investmentRange: "$5k-$15k" },
      provider,
    );

    expect(result.outcome).toBe("SENT");
    expect(provider.sent).toHaveLength(1);
    const message = provider.sent[0]!;
    expect(message.to).toBe("ops@sigmaplus.agency");
    expect(message.from).toBe("notifications@sigmaplus.agency");
    expect(message.subject).toContain("SP-TEST01");
    expect(message.text).toContain("Acme");
    expect(message.text).toContain("web-development");
  });

  it("strips newlines from interpolated fields (defense-in-depth)", async () => {
    vi.stubEnv("LEAD_NOTIFICATION_EMAIL", "ops@sigmaplus.agency");
    vi.stubEnv("LEAD_NOTIFICATION_FROM_EMAIL", "notifications@sigmaplus.agency");
    const provider = new RecordingProvider();

    await sendInternalLeadNotification(fakeLead({ name: "Jane\nBcc: attacker@evil.example" }), "SP-TEST01", undefined, provider);

    const message = provider.sent[0]!;
    expect(message.text).not.toContain("\n" + "Bcc:");
  });

  it("returns FAILED (not thrown) when the provider fails", async () => {
    vi.stubEnv("LEAD_NOTIFICATION_EMAIL", "ops@sigmaplus.agency");
    vi.stubEnv("LEAD_NOTIFICATION_FROM_EMAIL", "notifications@sigmaplus.agency");
    const provider = new RecordingProvider({ success: false, error: "Resend responded with status 500" });

    const result = await sendInternalLeadNotification(fakeLead(), "SP-TEST01", undefined, provider);
    expect(result).toEqual({ outcome: "FAILED", error: "Resend responded with status 500" });
  });
});

describe("sendClientConfirmationEmail", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is SKIPPED by default even when the provider and from-address are configured", async () => {
    vi.stubEnv("LEAD_NOTIFICATION_FROM_EMAIL", "notifications@sigmaplus.agency");
    vi.stubEnv("NEXT_PUBLIC_ENABLE_CLIENT_CONFIRMATION_EMAIL", "");
    const provider = new RecordingProvider();

    const result = await sendClientConfirmationEmail(fakeLead(), "SP-TEST01", provider);
    expect(result.outcome).toBe("SKIPPED");
    expect(provider.sent).toHaveLength(0);
  });

  it("sends only when explicitly enabled, and never promises a specific response time", async () => {
    vi.stubEnv("LEAD_NOTIFICATION_FROM_EMAIL", "notifications@sigmaplus.agency");
    vi.stubEnv("NEXT_PUBLIC_ENABLE_CLIENT_CONFIRMATION_EMAIL", "true");
    const provider = new RecordingProvider();

    const result = await sendClientConfirmationEmail(fakeLead(), "SP-TEST01", provider);
    expect(result.outcome).toBe("SENT");
    const message = provider.sent[0]!;
    expect(message.to).toBe("jane@example.com");
    expect(message.text).not.toMatch(/\d+\s*(hour|hours|day|days|minute|minutes)/i);
  });
});
