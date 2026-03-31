import { Resend } from "resend";

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  return new Resend(apiKey);
}

const FROM = process.env.EMAIL_FROM ?? "HelixForge <noreply@helixforge.com>";

export async function sendOnboardingEmail({
  to,
  name,
  plan,
}: {
  to: string;
  name: string;
  plan: "protocol" | "coaching";
}) {
  const resend = getResend();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://helixforge.com";

  const planLabel = plan === "coaching" ? "Protocol + AI Coaching" : "Protocol Access";

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `Welcome to HelixForge — Your ${planLabel} is Active`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
    .header { font-size: 24px; font-weight: bold; margin-bottom: 24px; }
    .card { border: 1px solid #e5e5e5; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .cta { display: inline-block; background: #1a1a1a; color: #fff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }
    .footer { font-size: 12px; color: #666; margin-top: 32px; border-top: 1px solid #e5e5e5; padding-top: 16px; }
    .step { display: flex; gap: 12px; margin: 16px 0; }
    .step-num { background: #1a1a1a; color: #fff; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; flex-shrink: 0; }
    .disclaimer { font-size: 11px; color: #888; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">HelixForge</div>

    <p>Hi${name ? ` ${name}` : ""},</p>

    <p>Your <strong>${planLabel}</strong> is now active. Here's your roadmap to get the most out of your 90-day protocol:</p>

    <div class="card">
      <strong>Your Next Steps</strong>
      <div class="step">
        <div class="step-num">1</div>
        <div>
          <strong>Upload your DNA</strong><br/>
          If you haven't already, upload your raw DNA file from 23andMe or AncestryDNA in your dashboard. This unlocks your full genetic blueprint.
        </div>
      </div>
      <div class="step">
        <div class="step-num">2</div>
        <div>
          <strong>Schedule your physician consultation</strong><br/>
          Before starting any peptide protocol, review the physician checklist in your account settings with your doctor.
        </div>
      </div>
      <div class="step">
        <div class="step-num">3</div>
        <div>
          <strong>Begin baseline assessments</strong><br/>
          Complete your initial strength testing and log your baseline biometrics in the dashboard.
        </div>
      </div>
      ${plan === "coaching" ? `
      <div class="step">
        <div class="step-num">4</div>
        <div>
          <strong>Start chatting with your AI Coach</strong><br/>
          Your coach has access to your genetic profile. Ask anything about peptides, training, or nutrition.
        </div>
      </div>` : ""}
    </div>

    <a href="${appUrl}/dashboard" class="cta">Go to My Dashboard</a>

    <div class="disclaimer">
      <strong>Medical Disclaimer:</strong> HelixForge does not sell, compound, or prescribe peptides.
      This email contains educational information only. All protocol changes require consultation
      with your personal licensed physician. If you experience any adverse reactions, discontinue
      use and seek medical attention immediately.
    </div>

    <div class="footer">
      &copy; ${new Date().getFullYear()} HelixForge Wellness. All rights reserved.<br/>
      You received this email because you created a HelixForge account.
    </div>
  </div>
</body>
</html>
    `,
  });

  if (error) {
    console.error("[email/onboarding] Send failed:", error);
    throw error;
  }

  return data;
}
