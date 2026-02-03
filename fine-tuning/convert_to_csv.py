import json
import csv

# Read JSONL file
examples = []
with open('fine_tune_data.jsonl', 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f, 1):
        data = json.loads(line.strip())
        user_msg = data['messages'][0]['content']
        assistant_msg = data['messages'][1]['content']
        examples.append({
            'ID': idx,
            'Question': user_msg,
            'Answer': assistant_msg
        })

# Write to CSV with UTF-8 BOM for Excel compatibility
with open('fine_tune_data.csv', 'w', newline='', encoding='utf-8-sig') as f:
    writer = csv.DictWriter(f, fieldnames=['ID', 'Question', 'Answer'])
    writer.writeheader()
    writer.writerows(examples)

print(f"Converted {len(examples)} examples to fine_tune_data.csv")
print(f"Columns: ID | Question | Answer")
print(f"\nYou can open it in Excel/Numbers for manual review.")
