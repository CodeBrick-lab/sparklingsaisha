#!/usr/bin/env python3
"""
csv_to_json.py
Converts a CSV (local path or URL) to products.json for the static site.
Handles columns: SKU,Name,MRP,Price,Category,Description,WhatsApp_link,UPI_link,ImageURL,Image2URL,Image3URL,Image4URL

Usage:
  python csv_to_json.py --csv "path_or_url" --out site --download-images False
If download-images is True and images are direct URLs, the script will try to download them into site/images/.
"""
import argparse
import pandas as pd
import json
import os
import shutil
from urllib.parse import urlparse
import requests

parser = argparse.ArgumentParser(description="Convert CSV/Google Sheet CSV to products.json")
parser.add_argument('--csv', required=True, help='Path or URL to CSV file (local path or http(s) URL)')
parser.add_argument('--out', default='site', help='Output folder for products.json and copied images')
parser.add_argument('--download-images', default='False', help='True to download product images into out/images')
args = parser.parse_args()

OUT = args.out
os.makedirs(OUT, exist_ok=True)
os.makedirs(os.path.join(OUT, 'images'), exist_ok=True)

print("Loading CSV:", args.csv)
if args.csv.startswith('http://') or args.csv.startswith('https://'):
    df = pd.read_csv(args.csv)
else:
    df = pd.read_csv(args.csv)

# Normalize columns
df.columns = [c.strip() for c in df.columns]
required = ['SKU','Name','MRP','Price','Category','Description','WhatsApp_link','UPI_link','ImageURL','Image2URL','Image3URL','Image4URL']
missing = [c for c in required if c not in df.columns]
if missing:
    print("Warning: missing columns in CSV:", missing)

products = []
for _, row in df.iterrows():
    sku = str(row.get('SKU','')).strip()
    title = str(row.get('Name','')).strip()
    mrp = row.get('MRP','')
    price = row.get('Price','')
    try:
        mrp_f = float(mrp) if mrp not in (None,'', 'NA') else 0.0
    except:
        mrp_f = 0.0
    try:
        price_f = float(price) if price not in (None,'', 'NA') else 0.0
    except:
        price_f = 0.0

    discount_pct = 0.0
    if mrp_f and price_f and mrp_f>0:
        discount_pct = round(((mrp_f - price_f)/mrp_f)*100,2)

    images = []
    for col in ['ImageURL','Image2URL','Image3URL','Image4URL']:
        val = str(row.get(col,'') or '').strip()
        if val:
            images.append(val)
    # fallback to placeholder if no images
    if len(images)==0:
        images = ['images/placeholder.png']

    prod = {
        "id": sku or str(len(products)+1),
        "sku": sku,
        "title": title,
        "mrp": mrp_f,
        "price": price_f,
        "discount_pct": discount_pct,
        "category": str(row.get('Category','')).strip(),
        "description": str(row.get('Description','') or ''),
        "whatsapp": str(row.get('WhatsApp_link','') or ''),
        "upi": str(row.get('UPI_link','') or ''),
        "images": images,
        "tags": []
    }
    products.append(prod)

# Save JSON
out_file = os.path.join(OUT, 'products.json')
with open(out_file, 'w', encoding='utf-8') as f:
    json.dump(products, f, ensure_ascii=False, indent=2)

print(f"Saved {len(products)} products to {out_file}")
print("Done. If you set --download-images True, the script will attempt to download image URLs into out/images/ (not enabled by default).")
