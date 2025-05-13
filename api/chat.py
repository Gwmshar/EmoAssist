from flask import Blueprint, request, jsonify
from langchain_ollama.llms import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from vector import retriever
from pymongo import MongoClient
import jwt

chat_bp = Blueprint('chat', __name__)

client = MongoClient('mongodb://localhost:27017/')
db = client['MajorProject']

sessions= db['Sessions']

model = OllamaLLM(model="llama3.2")

template = """
You are a helpful assistant that generate answers based on the information provided from my dataset. The question and answer are separated by ' : '.

Answer from dataset: {answer}

User question: {question}
"""

prompt = ChatPromptTemplate.from_template(template)
chain = prompt | model

SECRET_KEY = 'dgh3857hdshfjh@$$^%^^%&hdfgdfjg475845'

def decode_jwt(token):
    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return decoded
    except jwt.InvalidTokenError:
        return {'error': 'Invalid token'}

@chat_bp.route('/ask', methods=['POST'])
def ask_question():
    data = request.get_json()
    question = data.get("text")
    user = request.args.get('userId', '').strip()
    user_raw=decode_jwt(user)
    user_id=user_raw['user_id']
    session_id = data.get('session_id', '').strip()

    if not question:
        return jsonify({"error": "Question is required"}), 400
    
    session = sessions.find_one({"user_id": user_id, "session_id": session_id})
    if not session:
        session = {
            "user_id": user_id,
            "session_id": session_id,
            "context_by_sentiment": {},
            "last_known_sentiment": None,
            "conversation": []
        }
        sessions.insert_one(session)

    try:
        answer_docs = retriever.invoke(question)
        if not answer_docs:
            return jsonify({"emo": "Sorry, I couldn't find an answer to that question in the dataset."})

        content = answer_docs[0].page_content
        parts = content.split(":", 1)
        extracted_answer = parts[1].strip() if len(parts) > 1 else content.strip()

        result = chain.invoke({"answer": extracted_answer, "question": question})

        response = {
            "you": question,
            "emo": result,
        }

        sessions.update_one(
            {"user_id": user_id, "session_id": session_id},
            {
                "$push": {
                    "conversation": response
                }
            }
        )

        return jsonify(response)

    except Exception as e:
        return jsonify({"error": f"Failed to process: {str(e)}"})

    
