import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

function getCatalogReply(catalog, message) {
  const normalizedMessage = message.toLowerCase();
  const requestedQuantity = Number(normalizedMessage.match(/\b(\d+)\b/)?.[1] || 1);
  const quantity = Number.isInteger(requestedQuantity) && requestedQuantity > 0 ? requestedQuantity : 1;
  const matches = catalog.filter((product) => {
    const searchableText = `${product.name} ${product.description} ${product.tags.join(' ')}`.toLowerCase();
    const terms = normalizedMessage.split(/\s+/).filter((term) => term.length > 2);
    return terms.some((term) => searchableText.includes(term));
  });
  const selectedProduct = matches[0];
  if (!catalog.length) return { reply: 'The catalog is empty right now.', productId: null, quantity: 1 };
  if (!selectedProduct) {
    return {
      reply: `I couldn't find a product matching “${message}” in this catalog. I can help with ${catalog.map((product) => product.name).join(' or ')}.`,
      productId: null,
      quantity: 1
    };
  }
  return {
    reply: `I found ${selectedProduct.name} for ₹${(selectedProduct.price / 100).toLocaleString('en-IN')}. ${selectedProduct.description} Would you like me to add it to your checkout?`,
    productId: selectedProduct.id,
    quantity
  };
}

export async function createCatalogChatReply({ catalog, message, history = [] }) {
  if (!process.env.GEMINI_API_KEY) return getCatalogReply(catalog, message);

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: 'You are a concise ecommerce product assistant. Maintain context across the conversation: remember the buyer’s current request, rejected items, and preferences. Recommend only products in the supplied catalog. If the buyer asks for a product that is not in the catalog, say it is unavailable and do not substitute another product. Never invent products, prices, discounts, stock, or payment approval. Return JSON only with reply, productId, and quantity. quantity must be a positive integer requested by the buyer, otherwise 1. productId must be a catalog id or null.' }]
      },
      contents: [
        ...history.slice(-8).map((item) => ({ role: item.role === 'assistant' ? 'model' : 'user', parts: [{ text: item.text }] })),
        { role: 'user', parts: [{ text: JSON.stringify({ catalog, currentRequest: message, instruction: 'Use the conversation above as context for this request.' }) }] }
      ],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
    })
  });

  if (!response.ok) return getCatalogReply(catalog, message);
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  try {
    const result = JSON.parse(text);
    const product = catalog.find((item) => item.id === result.productId);
    const quantity = Number(result.quantity);
    return product && Number.isInteger(quantity) && quantity > 0
      ? { reply: result.reply, productId: product.id, quantity }
      : getCatalogReply(catalog, message);
  } catch {
    return getCatalogReply(catalog, message);
  }
}

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
