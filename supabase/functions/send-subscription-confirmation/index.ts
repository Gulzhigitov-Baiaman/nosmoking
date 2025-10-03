import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const getEmailTemplate = (language: string, amount: number) => {
  const templates = {
    en: {
      subject: "Premium Subscription Activated! 🎉",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Welcome to Premium!</h1>
          <p>Your Premium subscription has been successfully activated.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Amount paid:</strong> ₩${amount.toLocaleString()}</p>
            <p><strong>Trial period:</strong> 3 days free</p>
          </div>
          <p>Thank you for choosing Premium!</p>
          <p>Best regards,<br>Support Team</p>
        </div>
      `,
    },
    ko: {
      subject: "프리미엄 구독이 활성화되었습니다! 🎉",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">프리미엄에 오신 것을 환영합니다!</h1>
          <p>프리미엄 구독이 성공적으로 활성화되었습니다.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>결제 금액:</strong> ₩${amount.toLocaleString()}</p>
            <p><strong>체험 기간:</strong> 3일 무료</p>
          </div>
          <p>프리미엄을 선택해 주셔서 감사합니다!</p>
          <p>감사합니다,<br>지원팀</p>
        </div>
      `,
    },
    ru: {
      subject: "Premium подписка активирована! 🎉",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Добро пожаловать в Premium!</h1>
          <p>Ваша Premium подписка успешно активирована.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Сумма оплаты:</strong> ₩${amount.toLocaleString()}</p>
            <p><strong>Пробный период:</strong> 3 дня бесплатно</p>
          </div>
          <p>Спасибо за выбор Premium!</p>
          <p>С уважением,<br>Команда поддержки</p>
        </div>
      `,
    },
  };

  return templates[language as keyof typeof templates] || templates.en;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, language = "ko", amount = 9990 } = await req.json();

    console.log("📧 Sending subscription confirmation to:", email);
    console.log("📧 Language:", language);
    console.log("📧 Amount:", amount);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user email from user_id
    const { data: userData } = await supabaseClient.auth.admin.getUserById(email);
    const userEmail = userData?.user?.email;

    if (!userEmail) {
      throw new Error("User email not found");
    }

    const template = getEmailTemplate(language, amount);

    // Send to user
    const userEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Premium <onboarding@resend.dev>",
        to: [userEmail],
        subject: template.subject,
        html: template.html,
      }),
    });

    const userEmailData = await userEmailResponse.json();

    if (!userEmailResponse.ok) {
      console.error("Resend API error (user):", userEmailData);
      throw new Error(`Failed to send email to user: ${userEmailData.message || 'Unknown error'}`);
    }

    console.log("📧 Email sent to user:", userEmailData);

    // Send copy to admin
    const adminEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Premium <onboarding@resend.dev>",
        to: ["guljigitovbaiaman55@gmail.com"],
        subject: `[New Subscription] ${userEmail}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">New Premium Subscription</h2>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>User:</strong> ${userEmail}</p>
              <p><strong>Amount:</strong> ₩${amount.toLocaleString()}</p>
              <p><strong>Language:</strong> ${language}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            </div>
          </div>
        `,
      }),
    });

    const adminEmailData = await adminEmailResponse.json();
    console.log("📧 Admin notification sent:", adminEmailData);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ Error in send-subscription-confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
