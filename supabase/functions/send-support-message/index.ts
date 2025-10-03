import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SupportMessageRequest {
  name: string;
  email: string;
  message: string;
  language?: string;
}

const getEmailTemplate = (name: string, message: string, language: string) => {
  const templates = {
    en: {
      subject: "We received your message!",
      html: `
        <h1>Thank you for contacting us, ${name}!</h1>
        <p>We have received your message and will get back to you as soon as possible.</p>
        <p><strong>Your message:</strong></p>
        <p>${message}</p>
        <p>Best regards,<br>The Support Team</p>
      `,
    },
    ko: {
      subject: "메시지를 받았습니다!",
      html: `
        <h1>${name}님, 문의해 주셔서 감사합니다!</h1>
        <p>메시지를 받았으며 빠른 시일 내에 답변드리겠습니다.</p>
        <p><strong>메시지:</strong></p>
        <p>${message}</p>
        <p>감사합니다,<br>지원팀</p>
      `,
    },
    ru: {
      subject: "Мы получили ваше сообщение!",
      html: `
        <h1>Спасибо за ваше обращение, ${name}!</h1>
        <p>Мы получили ваше сообщение и ответим в ближайшее время.</p>
        <p><strong>Ваше сообщение:</strong></p>
        <p>${message}</p>
        <p>С уважением,<br>Команда поддержки</p>
      `,
    },
  };

  return templates[language as keyof typeof templates] || templates.en;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, message, language = "ko" }: SupportMessageRequest = await req.json();

    console.log("📧 Sending support message from:", email);
    console.log("📧 Language:", language);

    const template = getEmailTemplate(name, message, language);

    // Send to user
    const userEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Support <onboarding@resend.dev>",
        to: [email],
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
        from: "Support <onboarding@resend.dev>",
        to: ["guljigitovbaiaman55@gmail.com"],
        subject: `[Support Request] From ${name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">New Support Request</h2>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>From:</strong> ${name} (${email})</p>
              <p><strong>Language:</strong> ${language}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</p>
            </div>
            <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
              <p><strong>Message:</strong></p>
              <p style="white-space: pre-wrap;">${message.replace(/\n/g, '<br>')}</p>
            </div>
          </div>
        `,
        reply_to: email,
      }),
    });

    const adminEmailData = await adminEmailResponse.json();
    console.log("📧 Admin notification sent:", adminEmailData);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Support message sent successfully" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-support-message function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
