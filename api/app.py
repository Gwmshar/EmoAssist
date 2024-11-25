from flask import Flask, request, jsonify
from flask_cors import CORS

import pandas as pd
from sklearn.preprocessing import LabelEncoder
from transformers import DistilBertForSequenceClassification
import torch
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

@app.route('/test', methods=['get'])
def test():
    return jsonify({"message": "Data received", "received_data": "yo"})

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
