import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import joblib
import sys
import warnings
import os

warnings.filterwarnings("ignore")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'best_model.pth')
LABEL_ENCODER_PATH = os.path.join(BASE_DIR, 'label_encoder.pkl')
IMAGE_PATH = sys.argv[1]
NUM_CLASSES = 15
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

def load_model(model_path, num_classes):
    model = models.resnet18(pretrained=False)
    model.fc = nn.Linear(model.fc.in_features, num_classes) 
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.to(device)
    model.eval()
    return model

def load_label_encoder(path):
    le = joblib.load(path)
    return le

def predict(image_path, model, transform, label_encoder=None):
    image = Image.open(image_path).convert('RGB')
    image = transform(image)
    image = image.unsqueeze(0).to(device)
    
    with torch.no_grad():
        outputs = model(image)
        _, predicted = torch.max(outputs, 1)
    
    class_idx = predicted.item()
    if label_encoder:
        class_name = label_encoder.inverse_transform([class_idx])[0]
        return class_name
    else:
        return class_idx

if __name__ == "__main__":
    model = load_model(MODEL_PATH, NUM_CLASSES)
    le = load_label_encoder(LABEL_ENCODER_PATH)
    prediction = predict(IMAGE_PATH, model, transform, label_encoder=le)
    
    if prediction == "No Finding":
        print("The X-ray of the given individual demonstrates clear lung fields with no radiographic evidence of acute cardiopulmonary disease. No abnormalities are detected. Routine health monitoring is advised.")
    else:
        print(f"The X-ray of the given individual demonstrates findings consistent with {prediction} such as  blunting of the costophrenic angle,bulging lower half . Clinical correlation is recommended, and appropriate medical management or follow-up should be initiated based on the diagnosis and severity. If findings are within normal limits, routine health monitoring is advised.")
