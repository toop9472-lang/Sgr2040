from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_RIGHT, TA_CENTER, TA_LEFT
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Try to register font
try:
    pdfmetrics.registerFont(TTFont('Arabic', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
    font_name = 'Arabic'
except:
    font_name = 'Helvetica'

# Create PDF
doc = SimpleDocTemplate(
    "/app/mobile/SAQR_MARKETING_CAMPAIGN.pdf",
    pagesize=A4,
    rightMargin=40,
    leftMargin=40,
    topMargin=40,
    bottomMargin=40
)

# Styles
styles = getSampleStyleSheet()
title_style = ParagraphStyle(
    'Title',
    parent=styles['Heading1'],
    fontName=font_name,
    fontSize=24,
    alignment=TA_CENTER,
    spaceAfter=20,
    textColor=colors.HexColor('#1a365d')
)

heading_style = ParagraphStyle(
    'Heading',
    parent=styles['Heading2'],
    fontName=font_name,
    fontSize=16,
    alignment=TA_LEFT,
    spaceAfter=12,
    textColor=colors.HexColor('#2c5282')
)

body_style = ParagraphStyle(
    'Body',
    parent=styles['Normal'],
    fontName=font_name,
    fontSize=10,
    alignment=TA_LEFT,
    spaceAfter=8,
    leading=14
)

# Content
story = []

# Title
story.append(Paragraph("SAQR APP", title_style))
story.append(Paragraph("Marketing Campaign Script", title_style))
story.append(Spacer(1, 30))

# Campaign Identity
story.append(Paragraph("CAMPAIGN IDENTITY", heading_style))
identity_data = [
    ['Details', 'Element'],
    ['Saqr - Earn from your time', 'Campaign Name'],
    ['Your Time = Your Money', 'Main Slogan'],
    ['Watch & Earn with Saqr', 'Secondary Slogan'],
    ['Gold (#FFD700) + Black (#0a0a0f)', 'Colors'],
    ['Youthful, Exciting, Trustworthy', 'Tone'],
]
identity_table = Table(identity_data, colWidths=[280, 150])
identity_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#FFD700')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('FONTNAME', (0, 0), (-1, -1), font_name),
    ('FONTSIZE', (0, 0), (-1, -1), 10),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
]))
story.append(identity_table)
story.append(Spacer(1, 20))

# Campaign Goals
story.append(Paragraph("CAMPAIGN GOALS", heading_style))
goals_data = [
    ['6 Months', '3 Months', '1 Month', 'Metric'],
    ['150,000', '50,000', '10,000', 'Downloads'],
    ['30,000', '15,000', '5,000', 'Active Users (MAU)'],
    ['200,000 SAR', '75,000 SAR', '15,000 SAR', 'Revenue'],
]
goals_table = Table(goals_data, colWidths=[100, 100, 100, 130])
goals_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#48bb78')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('FONTNAME', (0, 0), (-1, -1), font_name),
    ('FONTSIZE', (0, 0), (-1, -1), 10),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
]))
story.append(goals_table)
story.append(Spacer(1, 20))

# Target Audience
story.append(Paragraph("TARGET AUDIENCE", heading_style))
audience_text = """
PRIMARY SEGMENT:
Age: 18-35 years | Gender: Male & Female | Location: Saudi Arabia, Gulf, Egypt

INTERESTS:
- Making money online
- Free apps
- Games and entertainment
- Online shopping

SUB-SEGMENTS:
1. Students (18-24) - Looking for extra pocket money
2. Housewives (25-40) - Have free time
3. Employees (25-35) - Looking for side income
4. Job seekers (20-30) - Looking for opportunities
"""
story.append(Paragraph(audience_text, body_style))
story.append(PageBreak())

# Video Scripts
story.append(Paragraph("VIDEO SCRIPTS", heading_style))
story.append(Spacer(1, 10))

# Video 1
story.append(Paragraph("VIDEO 1: Main Ad (30 seconds)", heading_style))
video1_text = """
SCENE 1 (0-5 sec) - HOOK:
[Scene: Young person looking at phone, bored]
Music: Fast, exciting beat
Narrator: "Bored? Wasting time on social media?"

SCENE 2 (5-15 sec) - PROBLEM & SOLUTION:
[Scene: Same person discovers Saqr app]
Narrator: "With Saqr... your time is now money!"
[Animation: Saqr logo appears dramatically]
Narrator: "Watch short ads... earn real points!"

SCENE 3 (15-25 sec) - PROOF:
[Scene: Person watching ad in the app]
[Animation: +1 point added, balance increases]
Narrator: "Your points convert to cash you can withdraw!"

SCENE 4 (25-30 sec) - CALL TO ACTION:
[Scene: Person smiling with phone]
Narrator: "Download Saqr now... your time won't be wasted!"
[Text on screen: SAQR - Download Free - App Store & Google Play]
"""
story.append(Paragraph(video1_text, body_style))
story.append(Spacer(1, 15))

# Video 2
story.append(Paragraph("VIDEO 2: User Testimonial (15 seconds)", heading_style))
video2_text = """
[Scene: Real person talking to camera]
User: "I used to waste my time on social media..."
[Quick cut]
User: "Now with Saqr, I collect points every day and withdraw real money!"
[Shows phone with app]
User: "Try it... you won't regret it!"
[Text: SAQR - Download Now]
"""
story.append(Paragraph(video2_text, body_style))
story.append(Spacer(1, 15))

# Video 3
story.append(Paragraph("VIDEO 3: TikTok/Reels Short (7 seconds)", heading_style))
video3_text = """
[Second 1-2]: Person holding money: "Where's this from?"
[Second 3-5]: Shows phone with Saqr: "From Saqr! I watch and earn!"
[Second 6-7]: [Big text: Download Saqr Now!]
"""
story.append(Paragraph(video3_text, body_style))
story.append(PageBreak())

# Social Media
story.append(Paragraph("SOCIAL MEDIA ADS", heading_style))

# Twitter
story.append(Paragraph("TWITTER (X)", heading_style))
twitter_text = """
TWEET 1 - HOOK:
"Wasting time on your phone?
Turn it into money!

With #Saqr:
- Watch short ads
- Collect points
- Withdraw real cash

Download free now
#EarnOnline #Apps"

TWEET 2 - NUMBERS:
"Saqr users this month:
Total withdrawals: +50,000 SAR
New users: +3,000
App rating: 4.8/5

Join them now! #Saqr"
"""
story.append(Paragraph(twitter_text, body_style))
story.append(Spacer(1, 15))

# Instagram
story.append(Paragraph("INSTAGRAM", heading_style))
instagram_text = """
CAROUSEL POST (5 Slides):
Slide 1: "SAQR APP - Your Time = Your Money"
Slide 2: "HOW IT WORKS? Watch short ads"
Slide 3: "COLLECT POINTS - 60 seconds = 1 point"
Slide 4: "WITHDRAW CASH - To your e-wallet"
Slide 5: "DOWNLOAD FREE NOW! Link in bio"

REEL SCRIPT:
[Hook - First 3 seconds]: "Want money from your phone?"
[Content]: "This app called Saqr... watch short ads and earn points... withdraw real money!"
[CTA]: "Link in bio... try it!"
"""
story.append(Paragraph(instagram_text, body_style))
story.append(Spacer(1, 15))

# TikTok
story.append(Paragraph("TIKTOK", heading_style))
tiktok_text = """
VIDEO 1 - TREND STYLE:
[Sound]: Any trending sound
[Text on screen]: "POV: You discovered an app that pays you to watch"
[Scene]: Person surprised, shows Saqr app
[Caption]: "For real! Try it, link in bio #Saqr #Earn #fyp"

VIDEO 2 - BEFORE/AFTER:
[Before]: "Me before Saqr: Wasting time scrolling"
[After]: "Me after Saqr: Same scrolling but with money"
"""
story.append(Paragraph(tiktok_text, body_style))
story.append(PageBreak())

# Google Ads
story.append(Paragraph("GOOGLE ADS", heading_style))
google_text = """
KEYWORDS (High Intent):
- Earn from watching ads
- App to make money
- Best earning app
- Side income from phone

AD COPY 1:
Headline 1: Earn Money from Your Phone | Saqr App
Headline 2: Watch Short Ads and Earn Points
Headline 3: Fast & Reliable Withdrawal

Description 1: Download Saqr free and earn from watching ads. Thousands earn daily!
Description 2: Easy and trusted app. Collect points and withdraw to your wallet.

AD COPY 2:
Headline 1: Extra Income from Phone | Saqr
Headline 2: Earn Points from Rewarded Ads
Headline 3: Rating 4.8 | +10,000 Users

Description: Don't waste your time! Turn it to money with Saqr. Easy, fast, guaranteed.
"""
story.append(Paragraph(google_text, body_style))
story.append(PageBreak())

# Budget
story.append(Paragraph("3-MONTH BUDGET", heading_style))
budget_data = [
    ['Total', 'Month 3', 'Month 2', 'Month 1', 'Platform'],
    ['12,500 SAR', '3,500', '4,000', '5,000', 'Google Ads'],
    ['7,500 SAR', '2,000', '2,500', '3,000', 'Apple Search'],
    ['10,500 SAR', '3,000', '3,500', '4,000', 'Meta (FB+IG)'],
    ['8,500 SAR', '2,500', '3,000', '3,000', 'TikTok'],
    ['4,500 SAR', '1,000', '1,500', '2,000', 'Snapchat'],
    ['7,000 SAR', '1,500', '2,500', '3,000', 'Influencers'],
    ['50,500 SAR', '13,500', '17,000', '20,000', 'TOTAL'],
]
budget_table = Table(budget_data, colWidths=[85, 70, 70, 70, 135])
budget_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e53e3e')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#1a365d')),
    ('TEXTCOLOR', (0, -1), (-1, -1), colors.white),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('FONTNAME', (0, 0), (-1, -1), font_name),
    ('FONTSIZE', (0, 0), (-1, -1), 9),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
]))
story.append(budget_table)
story.append(Spacer(1, 20))

# ROI Expectations
story.append(Paragraph("ROI EXPECTATIONS", heading_style))
roi_data = [
    ['Value', 'Metric'],
    ['~2.5 SAR', 'Average Cost Per Install (CPI)'],
    ['~20,000', 'Expected Downloads'],
    ['6,000', 'Active Users (30%)'],
    ['15,000-30,000 SAR/month', 'Expected Revenue (AdMob)'],
    ['Month 3-4', 'Break-even Point'],
]
roi_table = Table(roi_data, colWidths=[200, 230])
roi_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#805ad5')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('FONTNAME', (0, 0), (-1, -1), font_name),
    ('FONTSIZE', (0, 0), (-1, -1), 10),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
]))
story.append(roi_table)
story.append(Spacer(1, 20))

# KPIs
story.append(Paragraph("KEY PERFORMANCE INDICATORS (KPIs)", heading_style))
kpi_data = [
    ['Target', 'KPI'],
    ['7,000/month', 'Downloads'],
    ['< 3 SAR', 'Cost Per Install'],
    ['> 40%', 'Day 1 Retention'],
    ['> 20%', 'Day 7 Retention'],
    ['> 10%', 'Day 30 Retention'],
    ['> 0.5 SAR/month', 'ARPU'],
    ['> $2', 'eCPM'],
    ['> 4.5', 'App Store Rating'],
]
kpi_table = Table(kpi_data, colWidths=[150, 280])
kpi_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#38a169')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('FONTNAME', (0, 0), (-1, -1), font_name),
    ('FONTSIZE', (0, 0), (-1, -1), 10),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
]))
story.append(kpi_table)
story.append(PageBreak())

# Influencer Outreach
story.append(Paragraph("INFLUENCER COLLABORATION", heading_style))
influencer_text = """
MESSAGE TEMPLATE:
"Hi [Influencer Name],

I'm [Name] from the Saqr app team.

I've been following your content and love it! We think your audience would benefit from our app.

SAQR: An app that lets users earn money from watching short ads.

COLLABORATION PROPOSAL:
- Short intro video (15-30 seconds)
- Compensation: [Amount] + discount code for your audience

Would you like to discuss further?

Thanks!"

INFLUENCER TIERS:
- Nano (1K-10K): 5-10 influencers, 200-500 SAR each
- Micro (10K-50K): 3-5 influencers, 500-1,500 SAR each
- Mid (50K-200K): 1-2 influencers, 2,000-5,000 SAR each
"""
story.append(Paragraph(influencer_text, body_style))
story.append(Spacer(1, 20))

# Publishing Schedule
story.append(Paragraph("WEEKLY PUBLISHING SCHEDULE", heading_style))
schedule_data = [
    ['Activity', 'Day'],
    ['Twitter: Tip/Info | Instagram: Tutorial Reel', 'Sunday'],
    ['Facebook: Interactive Post | TikTok: Trend Video', 'Monday'],
    ['Twitter: Statistic | Snapchat: Promo Story', 'Tuesday'],
    ['Instagram: Educational Carousel | TikTok: Testimonial', 'Wednesday'],
    ['All Platforms: Unified Content | Heavy Stories', 'Thursday'],
    ['Light/Interactive Content | Contests & Giveaways', 'Friday'],
    ['Performance Analysis | Strategy Adjustment', 'Saturday'],
]
schedule_table = Table(schedule_data, colWidths=[350, 80])
schedule_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3182ce')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('FONTNAME', (0, 0), (-1, -1), font_name),
    ('FONTSIZE', (0, 0), (-1, -1), 9),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
]))
story.append(schedule_table)
story.append(Spacer(1, 30))

# Footer
footer_style = ParagraphStyle(
    'Footer',
    parent=styles['Normal'],
    fontName=font_name,
    fontSize=9,
    alignment=TA_CENTER,
    textColor=colors.gray
)
story.append(Paragraph("=" * 60, footer_style))
story.append(Spacer(1, 10))
story.append(Paragraph("SAQR MARKETING CAMPAIGN", footer_style))
story.append(Paragraph("Prepared by Marketing Team - February 2026", footer_style))
story.append(Paragraph("Total Budget: 50,500 SAR (~$13,500 USD)", footer_style))

# Build PDF
doc.build(story)
print("PDF created successfully: /app/mobile/SAQR_MARKETING_CAMPAIGN.pdf")
