from flask import Flask, request, jsonify,make_response
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from pymongo import MongoClient
import jwt
from chatbotRoute import chatbot_bp
from text import textpredict_bp
from chat import chat_bp
from image import emotion_bp
import warnings
warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app, origins=["https://localhost:3000"])

bcrypt = Bcrypt(app)

client = MongoClient("mongodb://localhost:27017/")
db = client['MajorProject']
users = db['Users']
sessions=db['Sessions']

SECRET_KEY = 'dgh3857hdshfjh@$$^%^^%&hdfgdfjg475845'

def create_jwt(user_id):
    payload = {
        'user_id': user_id
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
    return token

def decode_jwt(token):
    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return decoded
    except jwt.InvalidTokenError:
        return {'error': 'Invalid token'}

#Text
app.register_blueprint(textpredict_bp)

#Image
app.register_blueprint(emotion_bp)

#chatbot
app.register_blueprint(chatbot_bp)
app.register_blueprint(chat_bp, url_prefix="/chat")

#Database

@app.route('/register',methods=['POST'])
def register():
    data=request.get_json()
    if users.find_one({"email": data['email']}):
        return jsonify({"status":"false"})

    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    result=users.insert_one({
        "name": data['name'],
        "email": data['email'],
        "password": hashed_password
    })
    user_id=str(result.inserted_id)
    response = make_response(jsonify({"status": "true"}))
    return response

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = users.find_one({"email": data['email']})

    if not user or not bcrypt.check_password_hash(user['password'], data['password']):
        return jsonify({"status":"false"})
    encode=create_jwt(str(user['_id']))
    decode=decode_jwt(encode)
    response = make_response(jsonify({
        "status": "true",
        "user": {
            "name": user['name'],
            "email": user['email'],
            "id":encode
        }
    }))
    return response


@app.route('/addSession',methods=['POST'])
def addSession():
    data=request.get_json()
    result=sessions.insert_one({
        "text": data['text'],
        "userId": data['userId'],
    })
    return jsonify({'status':'true'})

@app.route('/getSessions', methods=['GET'])
def getSessions():
    user = request.args.get('userId')
    user_id=decode_jwt(user)
    all_sessions = list(sessions.find({"user_id": user_id['user_id']}))
    for session in all_sessions:
        session["_id"] = str(session["_id"])
    return jsonify(all_sessions)

if __name__ == '__main__':
    app.run(debug=True)
