import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cigarettes_per_day, quit_date, pack_price } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const daysSmokeFree = quit_date 
      ? Math.floor((Date.now() - new Date(quit_date).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const systemPrompt = `Ты - эксперт по отказу от курения. Создай персональный 30-дневный план отказа от курения на русском языке.

Данные пользователя:
- Количество сигарет в день: ${cigarettes_per_day}
- Дней без курения: ${daysSmokeFree}
- Цена пачки: ₩${pack_price}

План должен включать:
1. Мотивационное вступление
2. Недельные цели (4 недели)
3. Конкретные советы для каждой недели
4. Упражнения и техники
5. Способы преодоления тяги
6. Рекомендации по замене привычек
7. Финансовую мотивацию (экономия денег)

Формат: структурированный текст с разделами и списками. Будь конкретным и практичным.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Создай для меня персональный план отказа от курения." }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Превышен лимит запросов. Попробуйте позже." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Недостаточно средств. Пополните баланс." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Ошибка генерации плана");
    }

    const data = await response.json();
    const generatedPlan = data.choices[0].message.content;

    return new Response(JSON.stringify({ plan: generatedPlan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating AI plan:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return new Response(
      JSON.stringify({ 
        error: "Unable to generate AI plan. Please try again." 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
