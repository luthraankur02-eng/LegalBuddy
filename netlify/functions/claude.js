exports.handler = async function (event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { message, history } = JSON.parse(event.body);

    const messages = history ? [...history, { role: "user", content: message }]
                             : [{ role: "user", content: message }];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 1024,
        system: `You are LegalBuddy AI — a helpful, friendly Indian legal information assistant. 
You help Indian citizens understand legal concepts, explain laws in simple Hindi and English, 
answer questions about IPC, CrPC, family law, property law, consumer rights, and more.
IMPORTANT: You provide general legal INFORMATION only, NOT legal advice.
Always recommend consulting a qualified lawyer for specific legal matters.
End every response with: "⚠️ Disclaimer: This is general information only, not legal advice. Please consult a qualified lawyer for your specific matter."
Keep responses clear and concise. You can respond in Hindi or English based on user's language.`,
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic API error:", data);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: data.error?.message || "API error" }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ reply: data.content[0].text }),
    };
  } catch (err) {
    console.error("Function error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
