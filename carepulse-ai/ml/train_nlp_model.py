import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline


X_train = [
    "hi", "hello", "hey", "வணக்கம்", "காலை வணக்கம்", "hey bot", "good morning",
    "my blood pressure is 120 over 80", "BP 140/90", "sugar is 150", "heart rate 85", 
    "நான் மாத்திரை போட்டேன்", "ரத்த அழுத்தம் 140க்கு 90", "took my medicine", "glucose 110",
    "what should I eat for diabetes", "தலை வலிக்கிறது என்ன செய்வது", "is paracetamol safe", "what is ibuprofen",
    "chest pain", "heart attack", "நெஞ்சு வலி", "bleeding", "i fainted", "it hurts a lot",
    "what is the weather", "tell me a joke", "who are you", "play a song", "hi how are you"
]

y_train = [
    "greeting", "greeting", "greeting", "greeting", "greeting", "greeting", "greeting",
    "log_vitals", "log_vitals", "log_vitals", "log_vitals", 
    "log_vitals", "log_vitals", "log_vitals", "log_vitals",
    "medical_question", "medical_question", "medical_question", "medical_question",
    "emergency", "emergency", "emergency", "emergency", "emergency", "emergency",
    "general_conversation", "general_conversation", "general_conversation", "general_conversation", "general_conversation"
]


model = Pipeline([

    ('tfidf', TfidfVectorizer(token_pattern=r"(?u)\b\w+\b")),
    ('clf', MultinomialNB(alpha=1.0))
])

print("Training Scikit-Learn Model...")
model.fit(X_train, y_train)
score = model.score(X_train, y_train)
print(f"Training Complete! Accuracy: {score * 100}%")

print("\nModel trained successfully. Because this is a mobile app without Python native support, we have translated the exact Naive Bayes mathematical implementation into pure JavaScript. See `services/scikitModel.js`.")
