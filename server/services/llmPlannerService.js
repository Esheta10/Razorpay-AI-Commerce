import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function createCheckoutPlan({ merchant, catalog, message }) {
  if (!openai) {
    return {
      intent: 'checkout',
      explanation: `Rule-based plan for ${merchant.name}: choose a relevant primary product and one configured cross-sell when available.`,
      confidence: 0.72
    };
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You plan ecommerce checkouts for buyer agents. Return JSON with intent, explanation, and confidence. Never approve payment; payment approval is handled by deterministic guardrails.'
      },
      {
        role: 'user',
        content: JSON.stringify({
          merchant: { name: merchant.name, growthGoal: merchant.growthGoal, guardrails: merchant.guardrails },
          catalog,
          buyerMessage: message
        })
      }
    ]
  });

  return JSON.parse(response.choices[0].message.content);
}
