import zipfile
import xml.etree.ElementTree as ET
import json
import os

def extract_text_from_odt(file_path):
    namespaces = {
        'text': 'urn:oasis:names:tc:opendocument:xmlns:text:1.0',
        'office': 'urn:oasis:names:tc:opendocument:xmlns:office:1.0'
    }
    
    paragraphs = []
    
    try:
        with zipfile.ZipFile(file_path, 'r') as z:
            content_xml = z.read('content.xml')
            
        root = ET.fromstring(content_xml)
        
        # Find all paragraph elements
        for p in root.findall('.//text:p', namespaces):
            # Extract text from the paragraph and its children
            text = "".join(p.itertext()).strip()
            if text:
                paragraphs.append(text)
                
        return paragraphs
    except Exception as e:
        print(f"Error extracting text: {e}")
        return []

if __name__ == "__main__":
    odt_file = "anche i conigli hanno le ali.odt"
    if not os.path.exists(odt_file):
        print(f"File not found: {odt_file}")
    else:
        paragraphs = extract_text_from_odt(odt_file)
        
        # Save to JSON
        output_file = "book_data.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(paragraphs, f, ensure_ascii=False, indent=2)
            
        print(f"Extracted {len(paragraphs)} paragraphs to {output_file}")
