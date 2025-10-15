import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, amount, currency } = await req.json();
    
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
      from: "Premium <noreply@lovable.app>",
      to: [email],
      subject: "Возврат средств - Premium подписка",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; background: #f9fafb; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
              .header { background: #3b82f6; padding: 30px 20px; text-align: center; }
              .header h1 { color: white; margin: 0; font-size: 24px; }
              .content { padding: 30px; }
              .info-box { background: #eff6ff; border: 2px solid #3b82f6; border-radius: 12px; padding: 20px; margin: 20px 0; }
              .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>💳 Возврат средств обработан</h1>
              </div>
              
              <div class="content">
                <p>Здравствуйте!</p>
                <p>Ваша подписка Premium была отменена в течение пробного периода, и мы автоматически обработали возврат средств.</p>
                
                <div class="info-box">
                  <h3 style="margin: 0 0 10px 0; color: #2563eb;">Детали возврата:</h3>
                  <p style="margin: 5px 0;"><strong>Сумма:</strong> ${amount} ${currency.toUpperCase()}</p>
                  <p style="margin: 5px 0;"><strong>Время обработки:</strong> 3-7 рабочих дней</p>
                  <p style="margin: 10px 0 0 0; font-size: 13px; color: #6b7280;">
                    Деньги вернутся на тот же способ оплаты, который вы использовали при подписке.
                  </p>
                </div>
                
                <p>Мы надеемся увидеть вас снова! Если у вас есть отзывы или предложения по улучшению нашего сервиса, напишите нам через раздел "Поддержка".</p>
              </div>
              
              <div class="footer">
                <p>Спасибо, что попробовали Premium!</p>
                <p style="margin-top: 10px;">© 2025 Quit Smoking App</p>
              </div>
            </div>
          </body>
        </html>
      `,
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify({ sent: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Refund email error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
