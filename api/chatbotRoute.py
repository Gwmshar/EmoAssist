from flask import Blueprint, jsonify, request
from pymongo import MongoClient
import pandas as pd
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from datetime import datetime
from bson.objectid import ObjectId
import jwt

client = MongoClient('mongodb://localhost:27017/')
db = client['MajorProject']

users_collection = db['Users']
sessions_collection = db['Sessions']

chatbot_bp = Blueprint('chatbot', __name__, url_prefix='/chatbot')
chatbot_bp.strict_slashes = False

data = pd.read_csv("D:\\Major Project\\ChatText.csv", encoding='windows-1252')
df = data[['question', 'answer', 'sentiment', 'topic']]

model_name = 'all-mpnet-base-v2'
model = SentenceTransformer(model_name)

question_embeddings = model.encode(df['question'].tolist(), convert_to_numpy=True)
question_embeddings = question_embeddings / np.linalg.norm(question_embeddings, axis=1, keepdims=True)

dimension = question_embeddings.shape[1]
index = faiss.IndexFlatIP(dimension)
index.add(question_embeddings)

tokenizer = AutoTokenizer.from_pretrained("vennify/t5-base-grammar-correction")
grammar_model = AutoModelForSeq2SeqLM.from_pretrained("vennify/t5-base-grammar-correction")

def correct_text(text):
    input_ids = tokenizer.encode("grammar: " + text, return_tensors="pt", max_length=512, truncation=True)
    outputs = grammar_model.generate(input_ids, max_length=128, num_beams=4, early_stopping=True)
    return tokenizer.decode(outputs[0], skip_special_tokens=True)

def get_or_create_session(user_id):
    session = sessions_collection.find_one({"user_id": user_id})

    if not session:
        session = {
            "user_id": user_id,
            "context_by_sentiment": {},
            "last_known_sentiment": None,
        }
        sessions_collection.insert_one(session)

    return session

def get_answer(user_id, session_id, user_query, similarity_threshold=0.6, top_k=1):
    session = sessions_collection.find_one({"user_id": user_id, "session_id": session_id})
    if not session:
        session = {
            "user_id": user_id,
            "session_id": session_id,
            "context_by_sentiment": {},
            "last_known_sentiment": None,
            "conversation": []
        }
        sessions_collection.insert_one(session)
    context_by_sentiment = session.get("context_by_sentiment", {})
    last_known_sentiment = session.get("last_known_sentiment", None)
    corrected_query = correct_text(user_query)
    print("Corrected query:", corrected_query)
    query_embedding = model.encode([corrected_query], convert_to_numpy=True)
    query_embedding = query_embedding / np.linalg.norm(query_embedding, axis=1, keepdims=True)

    similarity_scores, indices = index.search(query_embedding, top_k)
    top_score = float(similarity_scores[0][0])
    top_idx = indices[0][0]

    print("Initial similarity:", top_score)

    if top_score >= similarity_threshold:
        matched_row = df.iloc[top_idx]
        sentiment = matched_row['sentiment']
        context_by_sentiment.setdefault(sentiment, []).append(corrected_query)
        last_known_sentiment = sentiment

        response = {
            "answer": matched_row['answer'],
            "sentiment": sentiment,
            "topic": matched_row['topic']
        }
    else:
        if last_known_sentiment and last_known_sentiment in context_by_sentiment:
            fallback_context = " ".join(context_by_sentiment[last_known_sentiment] + [corrected_query])
            query_embedding = model.encode([fallback_context], convert_to_numpy=True)
            query_embedding = query_embedding / np.linalg.norm(query_embedding, axis=1, keepdims=True)

            similarity_scores, indices = index.search(query_embedding, top_k)
            top_score = float(similarity_scores[0][0])
            top_idx = indices[0][0]

            print("Fallback similarity:", top_score)

            if top_score >= similarity_threshold:
                matched_row = df.iloc[top_idx]
                sentiment = matched_row['sentiment']
                context_by_sentiment.setdefault(sentiment, []).append(corrected_query)
                last_known_sentiment = sentiment

                response = {
                    "answer": matched_row['answer'],
                    "sentiment": sentiment,
                    "topic": matched_row['topic']
                }
            else:
                response = {
                    "answer": "I'm not quite sure I understood that. Could you clarify your question?",
                    "sentiment": None,
                    "topic": None
                }
        else:
            response = {
                "answer": "I'm not quite sure I understood that. Could you clarify your question?",
                "sentiment": None,
                "topic": None
            }
    sessions_collection.update_one(
        {"user_id": user_id, "session_id": session_id},
        {
            "$set": {
                "context_by_sentiment": context_by_sentiment,
                "last_known_sentiment": last_known_sentiment
            },
            "$push": {
                "conversation": {
                    "you": user_query,
                    "emo": response["answer"]
                }
            }
        },
        upsert=True
    )

    return response

SECRET_KEY = 'dgh3857hdshfjh@$$^%^^%&hdfgdfjg475845'

def decode_jwt(token):
    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return decoded
    except jwt.InvalidTokenError:
        return {'error': 'Invalid token'}

@chatbot_bp.route('/', methods=['POST'])
def ask_chatbot():
    data = request.get_json()
    user = request.args.get('userId')
    user_raw=decode_jwt(user)
    user_id=user_raw['user_id']
    session_id = data.get('session_id')
    user_query = data.get('text')

    if not all([user_id, session_id, user_query]):
        return jsonify({"error": "Missing user_id, session_id, or user_query"}), 400

    response = get_answer(user_id, session_id, user_query)
    return jsonify(response)

@chatbot_bp.route('/addSession',methods=['POST'])
def add_session():
    data = request.get_json()
    user = request.args.get('userId', '').strip()
    user_raw=decode_jwt(user)
    user_id=user_raw['user_id']
    text = data.get('text')
    sub_text=text[:5]
    random_id = ObjectId()
    session_id=str(random_id)
    try:
        session = sessions_collection.find_one({"user_id": user_id, "session_id": session_id})
        session = {
                "user_id": user_id,
                "text":sub_text,
                "session_id": session_id,
                "context_by_sentiment": {},
                "last_known_sentiment": None,
                "conversation": []
            }
        sessions_collection.insert_one(session)
        return jsonify({"status":True,"id":session_id})
    except Exception as e:
        return jsonify({"status":False})

@chatbot_bp.route('/conversation', methods=['GET'])
def get_conversation():
    user = request.args.get('userId')
    user_raw=decode_jwt(user)
    user_id=user_raw['user_id']
    session_id = request.args.get('sessionId')
    session = sessions_collection.find_one({"user_id": user_id, "session_id": session_id})
    if not session:
        return jsonify({"status":False})
    conversation = session.get('conversation', [])
    return jsonify({
        "status":True,
        "conversation": conversation
    })

@chatbot_bp.route('/reset')
def reset_context():
    global context_by_sentiment, last_known_sentiment
    context_by_sentiment = {}
    last_known_sentiment = None
    return jsonify({"status": "reset"})
