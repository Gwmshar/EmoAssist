from flask import Flask, request, jsonify
from flask_cors import CORS

import pandas as pd
from sklearn.preprocessing import LabelEncoder
from transformers import DistilBertForSequenceClassification
import cv2
import tensorflow as tf
from tensorflow.keras.models import load_model
from io import BytesIO
import os
import requests
import torch
import urllib.parse
import numpy as np
import warnings
warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)

df = pd.read_csv("C:\\Users\\Gwmshar\\Downloads\\textdata.csv",index_col=0)
df = df.dropna()
df.isnull().sum()

label_encoder = LabelEncoder()
df['status_encoded'] = label_encoder.fit_transform(df['status'])
num_classes = len(label_encoder.classes_)
model = DistilBertForSequenceClassification.from_pretrained('distilbert-base-uncased', num_labels=num_classes)
model.load_state_dict(torch.load("C:\\Users\\Gwmshar\\Downloads\\distilbert.pth"))
model.eval()
from transformers import DistilBertTokenizerFast
tokenizer = DistilBertTokenizerFast.from_pretrained('distilbert-base-uncased')
def predict_batch(model, tokenizer, label_encoder, statements):
    inputs = tokenizer(statements, padding=True, truncation=True, max_length=128, return_tensors="pt")
    model.eval()
    
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        probs = torch.nn.functional.softmax(logits, dim=-1).cpu().numpy()
        predicted_class_idx = np.argmax(probs, axis=1)
        predicted_classes = label_encoder.inverse_transform(predicted_class_idx)
    result = []
    for i in range(len(statements)):
        formatted_probs = [round(prob, 2) for prob in probs[i]]
        result.append({
            "Predicted Class Label": predicted_classes[i],
            "Class Probabilities": formatted_probs
        })
    
    return result

def sanitize_filename(url):
    filename = os.path.basename(urllib.parse.urlparse(url).path)
    filename = filename.replace('?', '_').replace('&', '_').replace('=', '_')
    if not filename.endswith('.jpg') and not filename.endswith('.jpeg'):
        filename = filename.split('.')[0] + '.jpg'
    return filename

@app.route('/test', methods=['get'])
def test():
    return jsonify({"message": "Data received", "received_data": "yo"})

PHOTO_FOLDER = './photos'
os.makedirs(PHOTO_FOLDER, exist_ok=True)

@app.route('/image',methods=['POST'])
def imageFun():
    data=request.get_json()
    image_urls=data.get('name')
    imgModel = load_model("C:\\Users\\Gwmshar\\Downloads\\model1.h5")
    saved_paths=[]
    emotionList=[]
    emotionPercentage=[]
    for i, image_url in enumerate(image_urls):
        try:
            print(f"Processing URL: {image_url}")
            response = requests.get(image_url)
            if response.status_code == 200:
                filename = sanitize_filename(image_url)
                file_path = os.path.join(PHOTO_FOLDER, filename)
                nparr = np.frombuffer(response.content, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                if img is not None:
                    cv2.imwrite(file_path, img)
                    saved_paths.append(file_path)
                else:
                    saved_paths.append(f"Failed to decode image: {image_url}")
                    print(f"Failed to decode image: {image_url}")
            else:
                saved_paths.append(f"Failed to download (HTTP {response.status_code}): {image_url}")
                print(f"Failed to download: HTTP {response.status_code}")
            image_path = saved_paths[i]
            img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
            img = cv2.resize(img, (128, 128))
            img = img / 255.0
            img = np.stack([img] * 3, axis=-1)
            img = np.expand_dims(img, axis=0)
            predictions = imgModel.predict(img)
            predicted_class = np.argmax(predictions, axis=-1)
            emotion_labels = ['Anger', 'Disgust', 'Fear', 'Happiness', 'Sadness', 'Surprise']
            predicted_emotion = emotion_labels[predicted_class[0]]
            print(f"The predicted emotion is: {predicted_emotion}")
            softmax_predictions = tf.nn.softmax(predictions)
            percentages = (softmax_predictions.numpy() * 100)
            percentages_rounded = np.round(percentages, 2)
            print(percentages_rounded)
            percentages_list = [[round(value, 2) for value in row] for row in percentages_rounded.tolist()]
            print(percentages_list)
            print("Predicted class percentages after applying softmax:")
            emotionList.append(predicted_emotion)
            emotionPercentage.append(percentages_list[0])
        except Exception as e:
            saved_paths.append(f"Error with {image_url}: {str(e)}")
            print(f"Error with {image_url}: {str(e)}")
    res_data=[emotionList,emotionPercentage]
    return jsonify(res_data)
@app.route('/data',methods=['POST'])
def testPost():
    data=request.get_json()
    name=data.get('name')
    predictions = predict_batch(model, tokenizer, label_encoder, name)
    labels= [prediction['Predicted Class Label'] for prediction in predictions]
    datas = [
        [round(float(value), 2) for value in prediction['Class Probabilities']]
        for prediction in predictions
    ]
    res_data=[labels,datas]
    return jsonify(res_data)

if __name__ == '__main__':
    app.run(debug=True)
