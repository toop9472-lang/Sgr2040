import markdown
from weasyprint import HTML, CSS
import os

# Read the markdown file
with open('/app/mobile/PROFESSIONAL_REPORT.md', 'r', encoding='utf-8') as f:
    md_content = f.read()

# Convert markdown to HTML
html_content = markdown.markdown(md_content, extensions=['tables', 'fenced_code'])

# Create full HTML with Arabic support and styling
full_html = f'''
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
        
        body {{
            font-family: 'Cairo', 'Arial', sans-serif;
            direction: rtl;
            text-align: right;
            padding: 40px;
            line-height: 1.8;
            color: #333;
            background: #fff;
        }}
        
        h1 {{
            color: #1a365d;
            border-bottom: 3px solid #3182ce;
            padding-bottom: 10px;
            font-size: 28px;
        }}
        
        h2 {{
            color: #2c5282;
            margin-top: 30px;
            font-size: 22px;
        }}
        
        h3 {{
            color: #2b6cb0;
            font-size: 18px;
        }}
        
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }}
        
        th, td {{
            border: 1px solid #e2e8f0;
            padding: 12px;
            text-align: right;
        }}
        
        th {{
            background: #3182ce;
            color: white;
        }}
        
        tr:nth-child(even) {{
            background: #f7fafc;
        }}
        
        code {{
            background: #edf2f7;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
        }}
        
        pre {{
            background: #1a202c;
            color: #e2e8f0;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            direction: ltr;
            text-align: left;
        }}
        
        pre code {{
            background: none;
            color: #e2e8f0;
        }}
        
        .header {{
            text-align: center;
            margin-bottom: 40px;
        }}
        
        .highlight {{
            background: #ebf8ff;
            padding: 15px;
            border-radius: 8px;
            border-right: 4px solid #3182ce;
        }}
    </style>
</head>
<body>
    {html_content}
</body>
</html>
'''

# Save HTML first
with open('/app/mobile/PROFESSIONAL_REPORT.html', 'w', encoding='utf-8') as f:
    f.write(full_html)

# Convert to PDF
HTML(string=full_html).write_pdf('/app/mobile/PROFESSIONAL_REPORT.pdf')

print("PDF created successfully!")
