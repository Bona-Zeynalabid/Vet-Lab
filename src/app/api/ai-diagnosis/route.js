import { NextResponse } from "next/server";

function buildPrompt(caseData) {
  if (!caseData) return "No case data provided.";

  const {
    patient = {},
    owner = {},
    anamnesis = {},
    physicalExam = {},
    labDirectives = {},
  } = caseData;

  const labLines = [];
  ["blood", "urine", "feces", "nasal", "rumen"].forEach((type) => {
    const tests = labDirectives?.[type]?.tests || [];
    const notes = labDirectives?.[type]?.notes || "";
    if (tests.length || notes) {
      labLines.push(
        `${type.toUpperCase()}: ${tests.join(", ") || "—"} ${
          notes ? `| Notes: ${notes}` : ""
        }`
      );
    }
  });

  return `PATIENT SIGNALMENT
- Species: ${patient.species || "Unknown"}
- Breed: ${patient.breed || "—"}
- Age: ${patient.age || "—"}
- Sex: ${patient.sex || "—"}
- Weight: ${patient.weight ? `${patient.weight} kg` : "—"}
- Number of animals: ${patient.numberOfAnimals || 1}

PRESENTING COMPLAINT & HISTORY
- Complaint: ${anamnesis.primaryComplaint || "—"}
- Medical history: ${anamnesis.history || "—"}

PHYSICAL EXAMINATION
- Demeanor: ${physicalExam.demeanor || "—"}
- Body condition: ${physicalExam.bcs || "—"}
- Mucous membrane: ${physicalExam.mucousMembrane || "—"}
- CRT: ${physicalExam.crt || "—"}
- Temperature: ${physicalExam.temperature ? `${physicalExam.temperature} °C` : "—"}
- Respiratory rate: ${physicalExam.respiratoryRate || "—"}
- Pulse rate: ${physicalExam.pulseRate || "—"}
- Heart sound: ${physicalExam.heartSound || "—"}
- Lung sound: ${physicalExam.lungSound || "—"}
- GI motility: ${physicalExam.giMotility || "—"}
- Other findings: ${physicalExam.otherFindings || "—"}

LAB DIRECTIVES
${labLines.length ? labLines.join("\n") : "None recorded."}`;
}

// Fallback chain — verified-live instruct models.
// "openrouter/free" is the auto-router and goes first;
// the rest are explicit instruct-tuned models with reliable output.
const MODEL_CHAIN = [
  "openrouter/free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "z-ai/glm-4.5-air:free",
  "google/gemma-3-27b-it:free",
  "openai/gpt-oss-20b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
];

const SYSTEM_PROMPT =
  "You are a licensed veterinarian. Answer DIRECTLY and CONCISELY. " +
  "Do not include chain-of-thought, reasoning traces, or preamble. " +
  "Output ONLY the final structured diagnosis in the requested format.";

export async function POST(request) {
  try {
    const { caseData } = await request.json();
    if (!caseData) {
      return NextResponse.json({ error: "caseData is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY not configured" },
        { status: 500 }
      );
    }

    const userPrompt = `${buildPrompt(caseData)}

Respond with EXACTLY the following format — no markdown, no headers, no extra commentary:

1. PRIMARY TENTATIVE DIAGNOSIS
<one line>

2. TOP DIFFERENTIAL DIAGNOSES
- <line 1>
- <line 2>
- <line 3>

3. MOST LIKELY DEFINITIVE DIAGNOSIS
<one line if evidence supports it, otherwise write: Insufficient evidence — further tests recommended.>

4. CLINICAL JUSTIFICATION
<2–3 concise sentences linking findings to the diagnosis.>

5. RECOMMENDED NEXT STEPS
- <short action 1>
- <short action 2>

Keep the total under 220 words. Be specific and clinical.`;

    let lastError = "";

    for (const model of MODEL_CHAIN) {
      try {
        const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer":
                process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
              "X-Title": "HU-Brooke VetTrack",
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userPrompt },
              ],
              temperature: 0.3,
              max_tokens: 2000, // high enough for reasoning models
            }),
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          lastError = `${model} → ${response.status} ${errText.slice(0, 120)}`;
          console.warn("[AI] HTTP error:", lastError);
          continue;
        }

        const data = await response.json();
        const choice = data?.choices?.[0];
        const msg = choice?.message || {};

        // Read from content OR reasoning (reasoning models put output there)
        const text =
          msg.content?.trim() ||
          msg.reasoning?.trim() ||
          msg.refusal?.trim() ||
          "";

        if (text) {
          console.log(
            `[AI] Success with ${model} (len=${text.length}, finish=${choice?.finish_reason})`
          );
          return NextResponse.json({ diagnosis: text, model });
        }

        const finish = choice?.finish_reason || "unknown";
        const keys = Object.keys(msg).join(",");
        lastError = `${model} → empty (finish=${finish}, keys=${keys})`;
        console.warn("[AI] Empty response:", lastError);
      } catch (err) {
        lastError = `${model} → network: ${err.message}`;
        console.warn("[AI] Network error:", lastError);
      }
    }

    console.error("[AI] All models failed. Last:", lastError);
    return NextResponse.json(
      { error: `AI service unavailable. ${lastError}` },
      { status: 502 }
    );
  } catch (error) {
    console.error("AI diagnosis route error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}