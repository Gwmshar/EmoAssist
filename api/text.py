from flask import Blueprint, request, jsonify
import torch
from transformers import BertTokenizer, BertModel
import torch.nn as nn
import numpy as np

textpredict_bp = Blueprint('predict', __name__)

labels = ['Anxiety', 'Bipolar', 'Depression', 'Normal', 'Personality disorder', 'Stress', 'Suicidal']

class CustomBERTClassifier(nn.Module):
    def __init__(self, dropout_rate=0.5, num_labels=7):
        super(CustomBERTClassifier, self).__init__()
        self.bert = BertModel.from_pretrained('bert-base-uncased')
        self.dropout = nn.Dropout(dropout_rate)
        self.classifier = nn.Linear(self.bert.config.hidden_size, num_labels)

    def forward(self, input_ids, attention_mask):
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        pooled_output = outputs.pooler_output
        x = self.dropout(pooled_output)
        logits = self.classifier(x)
        return logits

tokenizer = BertTokenizer.from_pretrained("D:\\Major Project\\bert_tokenizer\\")
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model = CustomBERTClassifier(dropout_rate=0.5, num_labels=7)
model.load_state_dict(torch.load("D:\\Major Project\\bert_classifier.pt", map_location=device))
model.to(device)
model.eval()

def predict_batch(text_list):
    tokens = tokenizer(
        text_list,
        padding=True,
        truncation=True,
        max_length=128,
        return_tensors="pt"
    )
    input_ids = tokens['input_ids'].to(device)
    attention_mask = tokens['attention_mask'].to(device)

    with torch.no_grad():
        outputs = model(input_ids, attention_mask)
        probs = torch.nn.functional.softmax(outputs, dim=-1).cpu().numpy()
        predicted_indices = np.argmax(probs, axis=1)

    results = []
    for i in range(len(text_list)):
        formatted_probs = [round(prob, 2) for prob in probs[i]]
        results.append({
            "Predicted Label": labels[predicted_indices[i]],
            "Class Probabilities": formatted_probs
        })
    return results

@textpredict_bp.route('/text', methods=['POST'])
def testPost():
    data = request.get_json()
    name = data.get('name')
    messages = [item['message'] for item in name]
    predictions = predict_batch(messages)
    predicted_labels = [p['Predicted Label'] for p in predictions]
    class_probs = [[float(val) for val in p['Class Probabilities']] for p in predictions]
    return jsonify([predicted_labels, class_probs])
