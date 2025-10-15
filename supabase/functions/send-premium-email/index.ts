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
    const { email, subscriptionId, trialEnd } = await req.json();
    
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const origin = req.headers.get("origin") || "https://xzcrzqyhubrsndopnzxj.supabase.co";
    
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
      from: "Premium <noreply@lovable.app>",
      to: [email],
      subject: "🎉 Вы приобрели Premium-подписку!",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; background: #f0f9f4; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #10b981, #059669); padding: 40px 20px; text-align: center; }
              .header h1 { color: white; margin: 0; font-size: 28px; }
              .crown { font-size: 48px; }
              .content { padding: 40px 30px; }
              .feature { display: flex; align-items: center; margin: 15px 0; }
              .feature-icon { font-size: 24px; margin-right: 12px; }
              .trial-box { background: #fef3c7; border: 2px solid #fbbf24; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
              .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
              .button { display: inline-block; background: #10b981; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="crown">👑</div>
                <h1>Поздравляем с Premium!</h1>
              </div>
              
              <div class="content">
                <p>Здравствуйте!</p>
                <p>Ваша Premium-подписка успешно активирована. Теперь у вас есть доступ ко всем возможностям приложения!</p>
                
                <div class="trial-box">
                  <h3 style="margin: 0 0 10px 0; color: #d97706;">🎁 3 дня бесплатно</h3>
                  <p style="margin: 0; font-size: 14px;">
                    У вас есть 3 дня, чтобы попробовать все функции.<br>
                    Первый платеж будет списан <strong>${new Date(trialEnd).toLocaleDateString('ru-RU')}</strong>
                  </p>
                  <p style="margin: 10px 0 0 0; font-size: 13px; color: #6b7280;">
                    Не понравилось? Отмените в любой момент — деньги вернутся автоматически.
                  </p>
                </div>
                
                <h3>Что доступно в Premium:</h3>
                <div class="feature"><span class="feature-icon">📅</span> Календарь прогресса с визуализацией</div>
                <div class="feature"><span class="feature-icon">💬</span> Общий чат поддержки</div>
                <div class="feature"><span class="feature-icon">👥</span> Друзья и лидерборды</div>
                <div class="feature"><span class="feature-icon">📊</span> План постепенного снижения</div>
                <div class="feature"><span class="feature-icon">🤖</span> AI-план (персональный)</div>
                <div class="feature"><span class="feature-icon">📄</span> PDF отчёты о прогрессе</div>
                <div class="feature"><span class="feature-icon">🏆</span> Челленджи и достижения</div>
                <div class="feature"><span class="feature-icon">⭐</span> Приоритетная поддержка</div>
                
                <div style="text-align: center;">
                  <a href="${origin}/dashboard" class="button">Перейти в приложение</a>
                </div>
                
                <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                  <strong>ID подписки:</strong> ${subscriptionId}<br>
                  <strong>Стоимость:</strong> ₩9,990 / месяц<br>
                  <strong>Следующий платеж:</strong> ${new Date(trialEnd).toLocaleDateString('ru-RU')}
                </p>
              </div>
              
              <div class="footer">
                <p>Если у вас есть вопросы, свяжитесь с нами через раздел "Поддержка" в приложении.</p>
                <p style="margin-top: 10px;">© 2025 Quit Smoking App. Все права защищены.</p>
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
    console.error("Email error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
