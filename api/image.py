import os
import torch
import torch.nn as nn
import torch.nn.functional as F
from flask import Blueprint, request, jsonify
from torchvision import models, transforms
from PIL import Image
import requests
import io
from io import BytesIO
import numpy as np
import base64
import jwt
from pymongo import MongoClient

emotion_bp = Blueprint("emotion", __name__)

client = MongoClient("mongodb://localhost:27017/")
db = client['MajorProject']
users = db['Users']
sessions=db['Sessions']

SECRET_KEY = 'dgh3857hdshfjh@$$^%^^%&hdfgdfjg475845'

def decode_jwt(token):
    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return decoded
    except jwt.InvalidTokenError:
        return {'error': 'Invalid token'}

resText = {
    "anger":
      "It seems your image is indicating anger. I understand you're feeling angry. It's completely normal to feel this way sometimes. Would you like to talk about what's causing this anger? Expressing your feelings can be helpful.",
    "disgust":
      "It seems like you're experiencing disgust. It can be tough to deal with uncomfortable emotions. If you'd like, we can explore what might be triggering this feeling.",
    "fear": "I sense fear in your image. Feeling afraid can be overwhelming. You're not alone, and it’s okay to feel this way. Would you like some calming techniques or grounding exercises to ease your mind?",
    "happiness":
      "It seems your image is indicating happiness. That's wonderful! I’m glad you're feeling happy. Celebrating positive moments is so important. What’s bringing you joy today?",
    "sadness":
      "It seems your image is indicating sadness. I'm sorry you're feeling sad. It’s okay to feel this way, and I’m here to listen. Would it help to talk about what’s been on your mind?",
    "neutral":
      "It seems like you’re feeling neutral. That’s completely okay. If you'd like to chat, I’m here for you. We can talk about anything on your mind.",
}

PHOTO_FOLDER = "./photos"
os.makedirs(PHOTO_FOLDER, exist_ok=True)

emotion_labels = ['anger', 'disgust', 'fear', 'happy', 'neutral', 'sad']

transform = transforms.Compose([
    transforms.Grayscale(num_output_channels=3),
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5]*3, std=[0.5]*3)
])

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
imgModel = models.resnet18(pretrained=False)
num_features = imgModel.fc.in_features
imgModel.fc = nn.Sequential(
    nn.Linear(num_features, 512),
    nn.ReLU(),
    nn.Dropout(0.6),
    nn.Linear(512, 6)
)
imgModel.load_state_dict(torch.load("D:\Major Project\emotion_modelv2.pth", map_location=device))
imgModel.to(device)
imgModel.eval()

def sanitize_filename(url):
    return url.split("/")[-1].split("?")[0]

@emotion_bp.route("/image", methods=["POST"])
def predict_emotions():
    data = request.get_json()
    image_urls = data.get('name', [])

    saved_paths = []
    emotionList = []
    emotionPercentage = []

    for image_url in image_urls:
        try:
            response = requests.get(image_url)
            if response.status_code != 200:
                saved_paths.append(f"Failed to download: HTTP {response.status_code}")
                continue

            img = Image.open(BytesIO(response.content)).convert('RGB')
            tensor_img = transform(img).unsqueeze(0).to(device)

            with torch.no_grad():
                predictions = imgModel(tensor_img)
                predicted_class = torch.argmax(predictions, dim=1).item()
                predicted_emotion = emotion_labels[predicted_class]

                softmax_predictions = F.softmax(predictions, dim=1)
                percentages = np.round(softmax_predictions.cpu().numpy() * 100, 2).tolist()[0]

                emotionList.append(predicted_emotion)
                emotionPercentage.append(percentages)

                filename = sanitize_filename(image_url)
                file_path = os.path.join(PHOTO_FOLDER, filename)
                img.save(file_path)
                saved_paths.append(file_path)

        except Exception as e:
            saved_paths.append(f"Error with {image_url}: {str(e)}")

    return jsonify({
        "emotions": emotionList,
        "percentages": emotionPercentage
    })

@emotion_bp.route('/chatImg', methods=['POST'])
def upload_image():
    data = request.get_json()

    user = request.args.get('userId', '').strip()
    user_raw=decode_jwt(user)
    user_id=user_raw['user_id']
    session_id = data.get('session_id', '').strip()
    img_data = data.get('image')

    if not user_id or not session_id:
        return jsonify({"error": "Missing user ID or session ID."})
    if not img_data:
        return jsonify({"error": "No image data provided."})

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
        header, encoded = img_data.split(',', 1)
        image_data = base64.b64decode(encoded)

        img = Image.open(io.BytesIO(image_data)).convert("RGB")
        img = transform(img).unsqueeze(0).to(device)

        with torch.no_grad():
            outputs = imgModel(img)
            _, predicted = torch.max(outputs, 1)
            predicted_class = predicted.item()

        predicted_emotion = emotion_labels[predicted_class]
        predicted_response = resText[predicted_emotion]

        response = {
            "you": img_data,
            "emo": predicted_response,
            "isImg": True
        }

        sessions.update_one(
            {"user_id": user_id, "session_id": session_id},
            {"$push": {"conversation": response}},
            upsert=True
        )

        return jsonify(response)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Failed to process image: {str(e)}"})