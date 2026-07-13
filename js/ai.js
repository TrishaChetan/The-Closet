// ai.js — OPTIONAL layer. The app works fully without this.
//
// If the user turns on "AI Stylist" and supplies their own Anthropic API key
// (Settings view), this calls the Claude API directly from their browser to
// answer freeform styling requests ("something for a rainy first date").
// The key is stored only in this browser's IndexedDB and is never sent
// anywhere except directly to api.anthropic.com.
//
// NOTE: calling the Anthropic API directly from a browser requires an
// `anthropic-dangerous-direct-browser-access: true` header. This is meant
// for personal/local tools like this one — for a multi-user production
// service you would proxy the call through your own backend instead so the
// key never touches client code at all. That's a fine future upgrade; it's
// not required to use this app.

const MODEL = 'claude-sonnet-4-6';

export async function getFreeformOutfitIdea({ apiKey, closetSummary, request }) {
  if (!apiKey) throw new Error('No API key set. Add one in Settings to use the AI Stylist.');

  const systemPrompt = `You are a wardrobe stylist helping someone pick an outfit from clothes they already own.
Only ever suggest items from the closet list you're given — never invent items they don't have.
Be concise: 2-4 sentences, name the specific items by their listed name, and briefly say why they work together.`;

  const userPrompt = `Here is my closet (name — category — colour — formality — tags):
${closetSummary}

Request: ${request}

Suggest an outfit using only items from this list.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`AI Stylist request failed (${response.status}). ${errText}`);
  }

  const data = await response.json();
  const textBlock = (data.content || []).find((b) => b.type === 'text');
  return textBlock ? textBlock.text : 'No suggestion returned.';
}

export function summarizeClosetForPrompt(items) {
  return items
    .map((i) => `- ${i.name} — ${i.category} — ${i.color?.name || 'unknown colour'} — ${i.formality} — tags: ${(i.tags || []).join(', ') || 'none'}`)
    .join('\n');
}
