
import { GEMINI_BASE_URL } from '../constants/geminiConfig';
const GEMINI_API_KEY_VISION = process.env.EXPO_PUBLIC_GEMINI_API_KEY_VISION;
const GEMINI_API_KEY_TEXT = process.env.EXPO_PUBLIC_GEMINI_API_KEY_TEXT;

import { localNLPModel } from './scikitModel';


async function callGemini(parts, apiKey, retryOnRateLimit = true) {
    const response = await fetch(GEMINI_BASE_URL(apiKey), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ role: 'user', parts }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 512,
            },
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        let reason = errText;
        try {
            const errJson = JSON.parse(errText);
            reason = errJson?.error?.message ?? errText;
        } catch { }


        if (response.status === 429 && retryOnRateLimit) {
            const waitMatch = reason.match(/retry in (\d+(?:\.\d+)?)s/i);
            const waitSecs = waitMatch ? Math.ceil(parseFloat(waitMatch[1])) : 20;
            await new Promise(r => setTimeout(r, waitSecs * 1000));
            return callGemini(parts, apiKey, false);
        }

        throw new Error(`Gemini ${response.status}: ${reason}`);
    }

    const json = await response.json();
    return json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}


// ── Feature 1: AI Recommendation (Groq Llama 3.3 70B) ─────────────────────
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function getAIRecommendation(patientData, language = 'en') {
    const {
        name, age, conditions = [], medications = [],
        systolicBP, diastolicBP, bloodSugar, heartRate,
        adherence, riskScore, riskLevel,
    } = patientData;

    // Strict system-level language directive — Llama respects system roles strongly
    const systemMessage = language === 'ta'
        ? 'நீங்கள் ஒரு மருத்துவ AI உதவியாளர். உங்கள் பதில்கள் முழுவதும் தமிழ் மொழியில் மட்டுமே இருக்க வேண்டும். எந்த ஆங்கில வார்த்தையும் பயன்படுத்தாதீர்கள். தமிழில் மட்டுமே பேசுங்கள்.'
        : 'You are a compassionate clinical AI assistant for a government health app. Respond in clear, simple English only.';

    const userPrompt = language === 'ta'
        ? `நோயாளி தகவல்:
- பெயர்: ${name || 'நோயாளி'}, வயது: ${age || 'தெரியவில்லை'}
- நோய்கள்: ${conditions.join(', ') || 'குறிப்பிடப்படவில்லை'}
- தற்போதைய மருந்துகள்: ${medications.join(', ') || 'குறிப்பிடப்படவில்லை'}
- ரத்த அழுத்தம்: ${systolicBP || '—'}/${diastolicBP || '—'} மி.மீ.எச்.ஜி
- ரத்த சர்க்கரை: ${bloodSugar || '—'} மி.கி/டி.எல்
- இதய துடிப்பு: ${heartRate || '—'} துடிப்பு/நிமிடம்
- மருந்து கடைப்பிடிப்பு: ${adherence || '—'}%
- தற்போதைய ஆபத்து மதிப்பெண்: ${riskScore || '—'}/100

பணி: இந்த நோயாளிக்கு 2-3 வாக்கியங்களில் ஊக்கமளிக்கும் மற்றும் நடைமுறைப்படுத்தக்கூடிய ஆரோக்கிய பரிந்துரை வழங்குங்கள். தமிழில் மட்டுமே பதில் அளிக்கவும்.`
        : `Patient Information:
- Name: ${name || 'Patient'}, Age: ${age || 'Unknown'}
- Conditions: ${conditions.join(', ') || 'Not specified'}
- Current Medications: ${medications.join(', ') || 'Not specified'}
- Blood Pressure: ${systolicBP || '—'}/${diastolicBP || '—'} mmHg
- Blood Sugar: ${bloodSugar || '—'} mg/dL
- Heart Rate: ${heartRate || '—'} bpm
- Medication Adherence: ${adherence || '—'}%
- Current Risk Score: ${riskScore || '—'}/100 (${riskLevel || 'unknown'} risk)

Task: Give a personalized, empathetic, and actionable health recommendation in exactly 2-3 sentences. Focus on their most concerning metrics. Be encouraging, not alarming. Avoid medical jargon.`;

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemMessage },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.6,
            max_completion_tokens: 250,
            stream: false,
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq API error ${response.status}: ${errText}`);
    }

    const json = await response.json();
    return json?.choices?.[0]?.message?.content?.trim() ?? '';
}




// ── Feature 2: Image/Report Analysis (Groq Llama 4 Scout Vision) ─────────
export async function analyzeReportImage(base64Data, mimeType = 'image/jpeg', language = 'en') {
    const langInstruction = language === 'ta'
        ? '"notes" புலத்தை தமிழில் வழங்கவும். மற்ற அனைத்து புலங்களும் எண்களாக மட்டுமே இருக்க வேண்டும்.'
        : 'Provide the "notes" field in English. All other fields must be numbers only.';

    const prompt = `You are a medical report analysis AI. Carefully examine this medical report image and extract health values.

Return ONLY a valid JSON object with this exact structure (use null for any value not found):
{
  "systolicBP": <number or null>,
  "diastolicBP": <number or null>,
  "bloodSugar": <number or null>,
  "heartRate": <number or null>,
  "hba1c": <number or null>,
  "cholesterol": <number or null>,
  "reportDate": "<string date or null>",
  "notes": "<brief 1-sentence summary of key findings>"
}

Rules:
- Extract ONLY numeric values. Do not include units in numeric fields.
- For blood pressure written as "130/85", systolicBP=130, diastolicBP=85.
- For HbA1c written as "7.2%", hba1c=7.2.
- If the image is not a medical report, return all null values with notes explaining why.
- Do NOT add any text outside the JSON object.
${langInstruction}`;

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:${mimeType};base64,${base64Data}`,
                            },
                        },
                        {
                            type: 'text',
                            text: prompt,
                        },
                    ],
                },
            ],
            temperature: 0.1,
            max_completion_tokens: 400,
            stream: false,
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq Vision error ${response.status}: ${errText}`);
    }

    const json = await response.json();
    const text = json?.choices?.[0]?.message?.content ?? '';

    try {
        const cleaned = text.replace(/```json\n?/gi, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
    } catch {
        return {
            systolicBP: null, diastolicBP: null,
            bloodSugar: null, heartRate: null,
            hba1c: null, cholesterol: null,
            notes: language === 'ta' ? 'படத்திலிருந்து தரவை பிரித்தெடுக்க முடியவில்லை.' : 'Could not extract data from the image.',
        };
    }
}



export async function parseVoiceInput(textInput, language = 'en') {
    const prompt = `You are an empathetic, highly intelligent medical data extraction AI assistant for a government health initiative. A patient has sent you a message (spoken or typed).
The input might be in English or Tamil.

Patient Input: "${textInput}"

Your task is to analyze the input and return a STRICT JSON object with no markdown formatting. The JSON must contain these exact keys:
{
  "intent": <string: "greeting", "log_vitals", "medical_question", "emergency", or "general_conversation">,
  "replyText": <string: an appropriate, empathetic response in the same language as the user>,
  "systolicBP": <number or null>,
  "diastolicBP": <number or null>,
  "bloodSugar": <number or null>,
  "heartRate": <number or null>,
  "medTaken": <boolean or null>
}

Rules for Intents:
1. "greeting": For inputs like "hi", "hello", "வணக்கம்", "காலை வணக்கம்", "hey bot".
   - replyText: A friendly greeting asking if they'd like to log their vitals today.
2. "log_vitals": The user is providing valid numbers like "my blood pressure is 120 over 80" or "நான் மாத்திரை போட்டேன்".
   - Extract the valid numbers into systolicBP, diastolicBP, bloodSugar, heartRate. 
   - Set medTaken to true/false if mentioned.
   - replyText: "Thank you, I have logged your data." (Translate to Tamil if user used Tamil).
   - CRITICAL OVERRIDE: If the numbers present a medical emergency (e.g., systolic BP > 180 or < 80, diastolic BP > 110 or < 50, blood sugar > 300 or < 60, heart rate > 120 or < 50), you MUST change the intent to "emergency" and warn them immediately in replyText.
3. "medical_question": The user asks a health question like "what should I eat for diabetes?" or "தலை வலிக்கிறது என்ன செய்வது?".
   - replyText: Give a brief, safe, general health suggestion but remind them you are just an AI and they should consult a doctor. Do NOT extract numbers.
4. "emergency": The user mentions chest pain, severe bleeding, fainting, "நெஞ்சு வலி", etc.
   - replyText: "URGENT: Please visit a hospital immediately or call emergency services (108)." (Translate to Tamil if needed).
5. "general_conversation": The user asks a question about anything else (e.g., "what is the weather?", "tell me a joke", "how does a car engine work?").
   - replyText: Act as a helpful, intelligent AI assistant and answer their question clearly and conversationally in the language they used. There are no restrictions on what topics you can discuss.

Other Rules:
- NEVER add extra text outside the JSON object.
- If an intent does not involve vitals, leave the vital fields as null.`;


    try {
        const text = await callGemini([{ text: prompt }], GEMINI_API_KEY_TEXT);
        const cleaned = text.replace(/```json\n?/gi, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.warn("Gemini API limit reached or failed. Falling back to Offline Regex NLP Engine:", e.message);
        return performOfflineNLP(textInput, language);
    }
}


function performOfflineNLP(text, language) {
    const lowerText = text.toLowerCase();


    const predictedIntent = localNLPModel.predict(lowerText);


    let result = {
        intent: predictedIntent,
        replyText: language === 'ta' ? "AI வரம்பு முடிந்தது. ஆஃப்லைன் ML மூலம் பகுப்பாய்கிறேன்." : "AI limit reached. Using Local ML Inference.",
        systolicBP: null, diastolicBP: null, bloodSugar: null, heartRate: null, medTaken: null
    };


    if (predictedIntent === "emergency") {
        result.replyText = language === 'ta' ? "அவசரம்: தயவுசெய்து மருத்துவமனைக்குச் செல்லவும் அல்லது 108 ஐ அழைக்கவும்!" : "URGENT: Please visit a hospital or call 108 immediately!";
        return result;
    }
    if (predictedIntent === "greeting") {
        result.replyText = language === 'ta' ? "வணக்கம்! உங்கள் ரத்த அழுத்தத்தை பதிவு செய்யலாமா?" : "Hello! Would you like to log your vitals today?";
        return result;
    }
    if (predictedIntent === "medical_question") {
        result.replyText = language === 'ta' ? "நான் ஒரு AI. தயவுசெய்து மருத்துவரை அணுகவும்." : "I am an AI. Please consult a doctor for medical advice.";
        return result;
    }
    if (predictedIntent === "general_conversation") {
        result.replyText = language === 'ta' ? "நான் ஒரு மருத்துவ AI உதவியாளர் மட்டுமே." : "I am a Govt Health Assistant. I can listen to your vitals.";
        return result;
    }


    const numbers = text.match(/\d+/g);

    const bpMatch = text.match(/(\d{2,3})[\s\/]*(over|க்கு|by|\/)[\s]*(\d{2,3})/i);
    if (bpMatch) {
        result.systolicBP = parseInt(bpMatch[1], 10);
        result.diastolicBP = parseInt(bpMatch[3], 10);
    } else if (numbers && numbers.length >= 2 && lowerText.includes('bp') || lowerText.includes('pressure') || lowerText.includes('அழுத்தம்')) {
        result.systolicBP = parseInt(numbers[0], 10);
        result.diastolicBP = parseInt(numbers[1], 10);
    }


    const sugarMatch = text.match(/(sugar|glucose|சர்க்கரை)[\s\w]*(\d{2,3})/i);
    if (sugarMatch) {
        result.bloodSugar = parseInt(sugarMatch[2], 10);
    } else if (numbers && !result.systolicBP && (lowerText.includes('sugar') || lowerText.includes('சர்க்கரை'))) {
        result.bloodSugar = parseInt(numbers[0], 10);
    }


    const hrMatch = text.match(/(heart rate|pulse|இதய துடிப்பு)[\s\w]*(\d{2,3})/i);
    if (hrMatch) {
        result.heartRate = parseInt(hrMatch[2], 10);
    }


    if (lowerText.match(/took.*medicine|pill|மாத்திரை|போட்டேன்/)) {
        result.medTaken = true;
    } else if (lowerText.match(/did not take|forgot.*medicine|மாத்திரை.*போடவில்லை/)) {
        result.medTaken = false;
    }


    const isHighRiskBP = (result.systolicBP && (result.systolicBP > 180 || result.systolicBP < 90)) ||
        (result.diastolicBP && (result.diastolicBP > 110 || result.diastolicBP < 50));
    const isHighRiskSugar = (result.bloodSugar && (result.bloodSugar > 300 || result.bloodSugar < 60));
    const isHighRiskHR = (result.heartRate && (result.heartRate > 120 || result.heartRate < 50));

    if (isHighRiskBP || isHighRiskSugar || isHighRiskHR) {
        result.intent = "emergency";
        result.replyText = language === 'ta'
            ? "அபாயம்! உங்கள் அளவுகள் மிகவும் ஆபத்தான நிலையில் உள்ளன. தயவுசெய்து உடனடியாக மருத்துவமனைக்குச் செல்லவும்!"
            : "⚠️ ALERT: Your vitals are at a critical risk level! Please seek immediate medical attention or call emergency services!";
        return result;
    }


    if (result.systolicBP || result.bloodSugar || result.heartRate || result.medTaken !== null) {
        result.intent = "log_vitals";
        result.replyText = language === 'ta' ? "நன்றி. உங்கள் தரவு பதிவு செய்யப்பட்டது." : "Got it. Your data is logged offline.";
    }

    return result;
}
