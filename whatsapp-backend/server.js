require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const aiService = require('./aiService');

const app = express();
app.use(bodyParser.json());


const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;


app.get('/webhook', (req, res) => {
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});


app.post('/webhook', async (req, res) => {
    let body = req.body;

    if (body.object) {
        if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages && body.entry[0].changes[0].value.messages[0]) {
            let phone_number_id = body.entry[0].changes[0].value.metadata.phone_number_id;
            let from = body.entry[0].changes[0].value.messages[0].from;
            let msg_body = body.entry[0].changes[0].value.messages[0].text?.body;

            console.log("Received Message from:", from);
            console.log("Message Content:", msg_body);

     
            if (msg_body) {
             
                const isTa = /[\u0B80-\u0BFF]/.test(msg_body);
                const language = isTa ? 'ta' : 'en';

           
                console.log("Processing through AI Pipeline...");
                const extractedData = await aiService.parseMessage(msg_body, language);

                let replyMessage = "";

           
                if (extractedData?.replyText && extractedData.intent !== "log_vitals") {
                    replyMessage = extractedData.replyText;
                } else if (extractedData?.intent === "log_vitals" || extractedData?.systolicBP || extractedData?.bloodSugar || extractedData?.heartRate || extractedData?.medTaken !== null) {
                    replyMessage = isTa ? "நன்றி. உங்கள் தரவு பாதுகாப்பாக பதிவு செய்யப்பட்டது:\n" : "Thank you. Your data is logged securely on Govt Server:\n";

                    if (extractedData?.systolicBP && extractedData?.diastolicBP) {
                        replyMessage += `• BP: ${extractedData.systolicBP}/${extractedData.diastolicBP} mmHg\n`;
                    }
                    if (extractedData?.bloodSugar) {
                        replyMessage += `• Sugar: ${extractedData.bloodSugar} mg/dL\n`;
                    }
                    if (extractedData?.heartRate) {
                        replyMessage += `• Heart Rate: ${extractedData.heartRate} bpm\n`;
                    }
                    if (extractedData?.medTaken !== null && extractedData?.medTaken !== undefined) {
                        replyMessage += `• Medicine: ${extractedData.medTaken ? 'Yes' : 'No'}\n`;
                    }
                } else {
                    replyMessage = isTa
                        ? "மன்னிக்கவும், எனக்குப் புரியவில்லை. நான் ஒரு AI உதவியாளர் மட்டுமே."
                        : "Sorry, I didn't understand that. I am a health assistant bot.";
                }

           
                if (extractedData.intent === "emergency") {
                    replyMessage = (isTa ? "⚠️ கோரிக்கை - " : "⚠️ CRITICAL ALERT: ") + replyMessage;
                }

                try {
                    await axios({
                        method: 'POST',
                        url: `https://graph.facebook.com/v19.0/${phone_number_id}/messages`,
                        headers: {
                            'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                            'Content-Type': 'application/json'
                        },
                        data: {
                            messaging_product: 'whatsapp',
                            to: from,
                            text: { body: replyMessage },
                        }
                    });
                    console.log("Reply sent successfully via Real WhatsApp API!");
                } catch (apiErr) {
                    console.error("Error sending response via Meta:", apiErr.response?.data || apiErr.message);
                }
            }
        }
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`CarePulse AI WhatsApp Webhook Server is listening on port ${PORT}`);
});
