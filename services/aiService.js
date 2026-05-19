const Groq = require('groq-sdk');
require('dotenv').config();

let groq = null;
try {
    if (process.env.GROQ_API_KEY) {
        groq = new Groq({
            apiKey: process.env.GROQ_API_KEY
        });
        console.log('[AI] Groq client initialized successfully');
        console.log('[AI] API Key present:', !!process.env.GROQ_API_KEY);
    } else {
        console.warn('[AI] GROQ_API_KEY not found in environment');
    }
} catch (err) {
    console.error('[AI] Failed to initialize Groq client:', err.message);
}

/**
 * Generate structured insights using Groq
 * Based STRICTLY on real computed metrics.
 */
exports.generateInsights = async (metrics) => {
    if (!groq) {
        throw new Error('GROQ_API_KEY_MISSING');
    }

    console.log('[AI INSIGHTS] Generating via Groq (llama-3.3-70b-versatile)');
    console.log('[AI] Input metrics:', JSON.stringify(metrics, null, 2));

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
            model: "llama-3.3-70b-versatile",
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
            temperature: 1,
            max_completion_tokens: 1024,
            top_p: 1,
            stream: false,
            stop: null
        });

        console.log('[AI] Raw response:', completion.choices[0].message.content);

        try {
            // Strip markdown code fences if present
            let rawContent = completion.choices[0].message.content;
            console.log('[AI] Full raw response length:', rawContent.length);
            console.log('[AI] Full raw response:', rawContent);
            
            // Find the JSON object between first { and last }
            const firstBrace = rawContent.indexOf('{');
            const lastBrace = rawContent.lastIndexOf('}');
            
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                rawContent = rawContent.substring(firstBrace, lastBrace + 1);
                console.log('[AI] Extracted JSON:', rawContent.substring(0, 200) + '...');
            } else {
                // Fallback: just remove code blocks
                rawContent = rawContent.replace(/```[a-z]*/g, '').trim();
                console.log('[AI] Fallback cleaned:', rawContent.substring(0, 200) + '...');
            }
            
            const result = JSON.parse(rawContent);
            console.log('[AI] Parsed successfully:', JSON.stringify(result).substring(0, 100) + '...');
            return result;
        } catch (parseErr) {
            console.error('[AI ERROR] Malformed JSON response from Groq');
            console.error('[AI] Parse error:', parseErr.message);
            throw new Error('AI_PARSING_ERROR');
        }
    } catch (err) {
        console.error(`[AI ERROR] Groq failure: ${err.message}`);
        console.error('[AI ERROR] Stack:', err.stack);
        throw err;
    }
};
