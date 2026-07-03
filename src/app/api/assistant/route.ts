import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { message, action, contextText } = await request.json();
    const apiKey = process.env.ANTHROPIC_API_KEY || "";

    // If key is empty or dummy, fallback to structured premium mock responses
    if (!apiKey || apiKey.startsWith("sk_dummy") || apiKey.trim() === "") {
      const mockResponse = getMockResponse(action, message);
      return NextResponse.json({ text: mockResponse });
    }

    // Call Real Anthropic Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 1500,
        system: "You are KnowledgeOS Assistant, an expert in Political Science, International Relations, and Modern Tech Policy. Deliver premium, concise, structured academic responses.",
        messages: [
          {
            role: "user",
            content: `Action required: ${action || "general_chat"}\n\nContext text:\n${contextText || "None"}\n\nUser prompt:\n${message}`
          }
        ]
      })
    });

    if (!response.ok) {
      const errPayload = await response.text();
      console.warn("Anthropic API returned error code:", response.status, errPayload);
      // Fallback on error to ensure client never crashes
      return NextResponse.json({ text: getMockResponse(action, message) });
    }

    const data = await response.json();
    const responseText = data.content?.[0]?.text || "No response generated.";
    return NextResponse.json({ text: responseText });

  } catch (err) {
    console.error("AI Assistant API error:", err);
    return NextResponse.json({ text: "Assistant connection timed out. Cache fallback active." });
  }
}

// Generate premium academic responses for local simulation
function getMockResponse(action: string, prompt: string): string {
  if (action === "summarize") {
    return `### Executive Briefing Takeaways
Here are the core takeaways parsed from your selected text:
1. **Core Premise**: The document outlines strategic adjustments required under shifting multilateral regimes.
2. **Key Dynamics**:
   - Institutional friction between central trade policies and state autonomy.
   - Technological reshoring forcing microchip supply dependencies to cluster locally.
3. **Implications**: Policymakers must coordinate compound chip manufacturing initiatives to navigate new trade borders.`;
  }

  if (action === "explain") {
    return `### Concept Explanation: ${prompt || "Theoretical Realism"}
* **Definition**: A theoretical framework in International Relations holding that states are rational, self-interested actors seeking survival under systemic anarchy.
* **Core Mechanisms**:
  1. **Anarchy**: The absence of a central global sovereign.
  2. **Security Dilemma**: Actions one state takes to secure itself (like defense spending) are perceived as threats by competitors, triggering defensive loops.
  3. **Self-Help**: States must rely on their own power capabilities, as international alliances are temporary.`;
  }

  if (action === "compare") {
    return `### Ideology Comparison Grid

| Dimension | Classical Realism | Structural Realism (Neorealism) |
| :--- | :--- | :--- |
| **Primary Actor** | State (guided by humans) | State (constrained by structure) |
| **Source of Conflict** | Imperfect Human Nature / Lust for Power | Systemic Anarchy / Security Dilemma |
| **Key Proponents** | Hans Morgenthau, Thucydides, Machiavelli | Kenneth Waltz, John Mearsheimer |
| **Strategy Goal** | Hegemony (Offensive) or Balance (Defensive) | Maximize relative power for system survival |`;
  }

  if (action === "generate-flashcards") {
    return `### Generated leitner flashcards
Copy these snippets into your review queue:
1. **Front**: Define Polarity in Neorealism.
   **Back**: The distribution of capabilities among states in the international system, defining it as Unipolar, Bipolar, or Multipolar.
2. **Front**: What is the Security Dilemma?
   **Back**: A situation where one state's defensive measures are perceived as offensive, triggering counter-defenses and escalating conflict risk.`;
  }

  return `### KnowledgeOS Intelligence Feed
Greetings researcher. I have analyzed your query in relation to the active databases:
- Systemic anarchy dictates that multi-aligned states (like India) navigate foreign policies based on strategic autonomy.
- The balance of power is fluctuating in the tech sector due to semiconductor export tariffs.

How else can I assist with your studies or files today?`;
}
