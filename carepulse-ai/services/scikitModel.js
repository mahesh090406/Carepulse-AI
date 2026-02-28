

class ScikitJSClassifier {
    constructor() {
        this.vocabulary = new Set();
        this.classCounts = {};
        this.wordCounts = {};
        this.totalDocs = 0;
    }

  
    tokenize(text) {
        return text.toLowerCase().match(/[\w\u0B80-\u0BFF]+/g) || [];
    }

  
    fit(X, y) {
        X.forEach((text, i) => {
            const label = y[i];
            const words = this.tokenize(text);

            this.classCounts[label] = (this.classCounts[label] || 0) + 1;
            if (!this.wordCounts[label]) this.wordCounts[label] = {};

            words.forEach(word => {
                this.vocabulary.add(word);
                this.wordCounts[label][word] = (this.wordCounts[label][word] || 0) + 1;
            });
            this.totalDocs++;
        });
    }

   
    predict(text) {
        const words = this.tokenize(text);
        if (words.length === 0) return "unknown";

        const logProbs = {};
        for (const label in this.classCounts) {
           
            let logProb = Math.log(this.classCounts[label] / this.totalDocs);

            const totalWordsInClass = Object.values(this.wordCounts[label]).reduce((a, b) => a + b, 0);
            const vocabSize = this.vocabulary.size;

        
            words.forEach(word => {
                const count = this.wordCounts[label][word] || 0;
                const probWordGivenClass = (count + 1) / (totalWordsInClass + vocabSize);
                logProb += Math.log(probWordGivenClass);
            });

            logProbs[label] = logProb;
        }

      
        return Object.keys(logProbs).reduce((a, b) => logProbs[a] > logProbs[b] ? a : b);
    }
}


const X_train = [
    "hi", "hello", "hey", "வணக்கம்", "காலை வணக்கம்", "hey bot", "good morning",
    "my blood pressure is 120 over 80", "BP 140/90", "sugar is 150", "heart rate 85",
    "நான் மாத்திரை போட்டேன்", "ரத்த அழுத்தம் 140க்கு 90", "took my medicine", "glucose 110", "120/80",
    "what should I eat for diabetes", "தலை வலிக்கிறது என்ன செய்வது", "is paracetamol safe", "what is ibuprofen",
    "chest pain", "heart attack", "நெஞ்சு வலி", "bleeding", "i fainted", "it hurts a lot",
    "what is the weather", "tell me a joke", "who are you", "play a song", "hi how are you"
];

const y_train = [
    "greeting", "greeting", "greeting", "greeting", "greeting", "greeting", "greeting",
    "log_vitals", "log_vitals", "log_vitals", "log_vitals",
    "log_vitals", "log_vitals", "log_vitals", "log_vitals", "log_vitals",
    "medical_question", "medical_question", "medical_question", "medical_question",
    "emergency", "emergency", "emergency", "emergency", "emergency", "emergency",
    "general_conversation", "general_conversation", "general_conversation", "general_conversation", "general_conversation"
];


export const localNLPModel = new ScikitJSClassifier();
localNLPModel.fit(X_train, y_train);
