import re
import datetime
import json
from PIL import Image
from django.conf import settings
from ai.groq_client import get_groq_llm
import pytesseract


def extract_receipt_data(image_path):
    """
    Performs real OCR using pytesseract and structures the extraction using Groq LLM.
    """
    # Default values
    extracted_data = {
        'merchant': 'Unknown Merchant',
        'amount': 0.0,
        'date': str(datetime.date.today()),
        'category': 'Shopping',
        'description': 'Scanned receipt'
    }

    try:
        # 1. Run actual OCR on the receipt image
        with Image.open(image_path) as img:
            raw_text = pytesseract.image_to_string(img)
        
        # If OCR returned empty or very short text, fall back to basic text
        if not raw_text or len(raw_text.strip()) < 5:
            raw_text = "No readable text found on the document."

        print("RAW TEXT EXTRACTED:", raw_text)

        # 2. Structured parsing using Groq
        llm = get_groq_llm(temperature=0.0)
        
        prompt = f"""You are an OCR receipt data parsing assistant.
Analyze the following raw receipt text extracted via OCR and extract structured fields.
Identify the transaction amount, merchant name, transaction date (format: YYYY-MM-DD), and classify the category.

For the 'description' field: Analyze all visible item names, quantities, and prices in the raw text, and write a concise, friendly, and descriptive summary of what was purchased (e.g., "Starbucks Coffee - 1x Caffe Latte with Vanilla Syrup").

Raw Receipt Text:
\"\"\"
{raw_text}
\"\"\"

Output JSON format ONLY:
{{
  "merchant": string (e.g. Starbucks, Walmart, or 'Unknown Merchant'),
  "amount": float (total amount paid, e.g. 450.00),
  "date": "YYYY-MM-DD" (use the transaction date found in the receipt text. Look closely at dates like '08-01' or '2026-08-01' and format it. If no date is found, use '{str(datetime.date.today())}'),
  "category": "Food" | "Shopping" | "Transport" | "Utilities" | "Entertainment" | "Other" (classify based on merchant or description),
  "description": string (detailed summary of merchant and items purchased, e.g., "MerchantName - Item1, Item2")
}}
"""
        messages = [
            {"role": "user", "content": prompt}
        ]
        
        response = llm.invoke(messages)
        content = response.content.strip()
        print("GROQ PARSER RESPONSE:", content)
        
        # Extract JSON using regular expression to avoid prefix/suffix text issues
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            json_str = match.group(0)
            parsed_json = json.loads(json_str.strip())
        else:
            parsed_json = json.loads(content.strip())
        
        # Merge parsed data with defaults to ensure safety
        for key in extracted_data:
            if key in parsed_json:
                extracted_data[key] = parsed_json[key]
                
    except Exception as e:
        print("OCR EXCEPTION ENCOUNTERED:", str(e))
        import traceback
        traceback.print_exc()

    return extracted_data
