const { GoogleGenerativeAI } = require("@google/generative-ai");
const { localNLPModel } = require('./scikitModel');

const GEMINI_API_KEY_TEXT = process.env.GEMINI_API_KEY_TEXT;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY_TEXT);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


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
    } else if (numbers && numbers.length >= 2 && (lowerText.includes('bp') || lowerText.includes('pressure') || lowerText.includes('அழுத்தம்'))) {
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


async function parseMessage(textInput, language = 'en') {
    const aiPrompt = `You are an empathetic, highly intelligent medical data extraction AI assistant for a government health initiative. A patient has sent you a message on WhatsApp.
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
        const result = await model.generateContent(aiPrompt);
        const response = await result.response;
        const text = response.text();

        const cleaned = text.replace(/```json\n?/gi, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.warn("Gemini API limit reached or failed natively on server. Falling back to Scikit Local Offline NLP System:", e.message);
        return performOfflineNLP(textInput, language);
    }
}

module.exports = { parseMessage };
