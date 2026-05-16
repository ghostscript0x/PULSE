const Groq = require('groq-sdk');
require('dotenv').config();

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

/**
 * Generate structured insights using Groq (Llama 3.3 70B)
 * Based STRICTLY on real computed metrics.
 */
exports.generateInsights = async (metrics) => {
    if (!groq) {
        throw new Error('GROQ_API_KEY_MISSING');
    }

    console.log('[AI INSIGHTS] Generating via Groq (Llama-3.3-70b)');

    const prompt = `
        Analyze the following Web3 DAO health metrics and provide structured intelligence.
        Metrics: ${JSON.stringify(metrics)}

        Return ONLY a JSON object with this structure:
        {
            "summary": "A concise executive summary (max 2 sentences)",
            "risks": ["List 2-3 specific risks based on the data"],
            "opportunities": ["List 2-3 specific opportunities"],
            "alerts": ["High priority alerts if any metrics are critical"]
        }
    `;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a DAO Intelligence Analyst. You only speak in JSON. You never fabricate data."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.2, // Lower temperature for more deterministic analysis
            max_completion_tokens: 1024,
            response_format: { type: "json_object" }
        });

        try {
            const result = JSON.parse(completion.choices[0].message.content);
            return result;
        } catch (parseErr) {
            console.error('[AI ERROR] Malformed JSON response from Groq');
            throw new Error('AI_PARSING_ERROR');
        }
    } catch (err) {
        console.error(`[AI ERROR] Groq failure: ${err.message}`);
        throw err;
    }
};
