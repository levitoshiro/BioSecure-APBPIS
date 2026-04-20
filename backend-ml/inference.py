import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
import cv2
import numpy as np
import os

# ==========================================
# 1. EXACT U-NET ARCHITECTURE (From Notebook)
# ==========================================
class DoubleConv(nn.Module):
    def __init__(self, in_channels, out_channels):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, 3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, 3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True)
        )
    def forward(self, x): 
        return self.conv(x)

class UNet(nn.Module):
    def __init__(self, n_channels, n_classes):
        super(UNet, self).__init__()
        self.inc = DoubleConv(n_channels, 64)
        self.down1 = nn.MaxPool2d(2); self.conv1 = DoubleConv(64, 128)
        self.down2 = nn.MaxPool2d(2); self.conv2 = DoubleConv(128, 256)
        self.down3 = nn.MaxPool2d(2); self.conv3 = DoubleConv(256, 512)
        self.up1 = nn.ConvTranspose2d(512, 256, 2, stride=2); self.conv4 = DoubleConv(512, 256)
        self.up2 = nn.ConvTranspose2d(256, 128, 2, stride=2); self.conv5 = DoubleConv(256, 128)
        self.up3 = nn.ConvTranspose2d(128, 64, 2, stride=2); self.conv6 = DoubleConv(128, 64)
        self.outc = nn.Conv2d(64, n_classes, kernel_size=1)

    def forward(self, x):
        x1 = self.inc(x)
        x2 = self.conv1(self.down1(x1))
        x3 = self.conv2(self.down2(x2))
        x4 = self.conv3(self.down3(x3))
        x = self.up1(x4)
        x = torch.cat([x3, x], dim=1); x = self.conv4(x)
        x = self.up2(x)
        x = torch.cat([x2, x], dim=1); x = self.conv5(x)
        x = self.up3(x)
        x = torch.cat([x1, x], dim=1); x = self.conv6(x)
        return torch.sigmoid(self.outc(x))

# ==========================================
# 2. ROBUST MODEL INITIALIZATION
# ==========================================
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"🚀 Initializing Zero-Trust Models on {device}...")

# --- Load DenseNet ---
densenet_model = models.densenet121(weights=None)
try:
    checkpoint = torch.load("densenet_best.pth", map_location=device)
    state_dict = checkpoint['model_state'] if 'model_state' in checkpoint else checkpoint
    
    # Auto-detect classes from weights
    if 'classifier.weight' in state_dict:
        num_classes = state_dict['classifier.weight'].shape[0]
    else:
        num_classes = state_dict[list(state_dict.keys())[-1]].shape[0]

    densenet_model.classifier = nn.Linear(densenet_model.classifier.in_features, num_classes)
    densenet_model.load_state_dict(state_dict)
    print(f"✅ DenseNet loaded ({num_classes} classes).")
except Exception as e:
    print(f"⚠️ DenseNet failed to load: {e}")

densenet_model.to(device)
densenet_model.eval()

# --- Load U-Net ---
# n_channels=3 matches your training script for RGB images
unet_model = UNet(n_channels=3, n_classes=1) 
try:
    unet_model.load_state_dict(torch.load("unet_medical.pth", map_location=device))
    print("✅ U-Net Segmentation Model loaded.")
except Exception as e:
    print(f"⚠️ U-Net failed to load: {e}")

unet_model.to(device)
unet_model.eval()

# ==========================================
# 3. EXPORTED PIPELINE FUNCTIONS
# ==========================================
def extract_features(image_path):
    """
    Matches your BiometricVault script: 
    Bypasses the classifier to extract the 1024-D fingerprint.
    """
    preprocess = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    img = Image.open(image_path).convert('RGB')
    input_tensor = preprocess(img).unsqueeze(0).to(device)
    
    with torch.no_grad():
        # Tap into the CNN backbone directly
        f_feat = densenet_model.features(input_tensor)
        f_feat = F.relu(f_feat, inplace=True)
        f_feat = F.adaptive_avg_pool2d(f_feat, (1, 1)).flatten()
        
    return f_feat.cpu().numpy().tolist()

def get_lesion_coordinates(image_path):
    """
    Runs your U-Net and outputs geometric SVG coordinates 
    for the React frontend.
    """
    preprocess = transforms.Compose([
        transforms.Resize((256, 256)), 
        transforms.ToTensor()
    ])
    
    try:
        # Note: Must be RGB to match n_channels=3
        img = Image.open(image_path).convert('RGB')
        input_tensor = preprocess(img).unsqueeze(0).to(device)
        
        with torch.no_grad():
            pred_mask = unet_model(input_tensor)
            
        pred_np = pred_mask.squeeze().cpu().numpy()
        binary_mask = (pred_np > 0.5).astype(np.uint8) * 255
        
        # Find contours (same as your draw_borders logic)
        contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        polygons = []
        for contour in contours:
            if cv2.contourArea(contour) > 20: 
                poly = []
                for point in contour:
                    x, y = point[0]
                    # Map coordinates to percentages (0-100)
                    poly.append({"x": round((x / 256.0) * 100, 2), "y": round((y / 256.0) * 100, 2)})
                polygons.append(poly)
                
        return polygons
        
    except Exception as e:
        print(f"Lesion Extraction Error: {e}")
        return []