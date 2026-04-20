<div align="center">

# 📧 eBoxAI
### The Intelligent, Prompt-Driven Email Agent

![License](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)
![Python](https://img.shields.io/badge/python-v3.9+-blue.svg?style=for-the-badge&logo=python)
![React](https://img.shields.io/badge/react-v18+-61DAFB.svg?style=for-the-badge&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)

<br />

> **"Stop managing emails. Start commanding them."**

eBoxAI transforms your inbox from a chaotic list into a structured, AI-powered command center.  
Categorize, summarize, and draft replies automatically—all controlled by your natural language prompts.

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Roadmap](#-roadmap)

</div>

---

## ✨ Features

### 🧠 **Prompt Brain**
**You are the architect.** Unlike black-box AI tools, eBoxAI lets you see and edit the exact prompts that drive the agent.
- *Tell it to be formal with clients.*
- *Tell it to be brief with internal updates.*
- *Tell it to ignore "limited time offers".*

### 🏷️ **Smart Categorization**
Forget manual sorting. The agent reads and tags every email instantly:
- **🔴 Important**: Urgent deadlines, boss requests, high-priority clients.
- **🔵 Newsletter**: Weekly digests, industry updates (kept out of your way).
- **🟡 To-Do**: Actionable items requiring your specific attention.
- **⚪ Spam**: Junk that slipped through the cracks.

### 📝 **Action Extraction & Auto-Drafting**
- **Action Items**: Automatically extracts tasks like *"Submit report by Friday"* or *"Call John at 2pm"*.
- **Draft Replies**: Pre-generates context-aware replies. You just review and hit send.

### 🛡️ **Security & Intelligence**
- **Dark Pattern Detector**: Warns you about manipulative emails (Fake Urgency, Scarcity).
- **Sentiment Analysis**: Instantly see the emotional tone of emails (😊 😐 😤).
- **Smart Follow-Ups**: Tracks your commitments and what others owe you.

### 🗓️ **Meeting Prep Assistant**
- **Auto-Briefs**: Generates executive briefs for upcoming meetings.
- **Context Retrieval**: Summarizes past threads and suggests talking points.

### 💬 **Agent Chat (RAG-Lite)**
**Talk to your inbox.**
- *"What did my boss ask for last week?"*
- *"Do I have any pending invoices?"*
- *"Draft a polite decline to the webinar invitation."*

---

## 🛠️ Tech Stack

| Layer | Technology | Why? |
|-------|------------|------|
| **Backend** | **Python, FastAPI** | High-performance async API with easy AI integration. |
| **AI Engine** | **Google Gemini API** | State-of-the-art LLM for reasoning and generation. |
| **Vector DB** | **Pinecone** | Fast semantic search via local sentence-transformers or Gemini. |
| **Frontend** | **React, Vite** | Blazing fast, modern UI development. |
| **Styling** | **Tailwind CSS** | Beautiful, responsive designs with "Linear-style" aesthetics. |
| **Database** | **SQLite** | Zero-config, local, and fast. |

---

## 🚀 Getting Started

<details>
<summary><strong>📋 Prerequisites</strong></summary>

- **Node.js** (v18+)
- **Python** (v3.9+)
- **Google Gemini API Key** (Optional, defaults to Mock Mode)
</details>

<details>
<summary><strong>🐍 Backend Setup</strong></summary>

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt

# (Optional) Add your API Key
# Copy .env.example to .env and add GEMINI_API_KEY=...

uvicorn backend.main:app --reload
```
</details>

<details>
<summary><strong>⚛️ Frontend Setup</strong></summary>

```bash
cd frontend
npm install
npm run dev
```
</details>

<details>
<summary><strong>🧠 Model Training & Data</strong></summary>

### Custom Model Training
We use a custom training pipeline to refine the agent's classification accuracy.
- **Advanced Ensemble Model**: An architecture combining TF-IDF + Logistic Regression and Random Forest.
- **Semantic & Metadata Understanding**: Uses sender domain patterns, urgency signals, and semantic text features instead of just keyword matching to ensure high accuracy without requiring API calls.

```bash
# Train the model
python backend/training/train_model.py

# Evaluate performance
python backend/scripts/evaluate.py
```

### 🎲 Rich Data Seeding
For a fully populated demo environment (Kanban board, rich email examples):
```bash
python backend/scripts/seed_rich_data.py
```
</details>

---
---

## 📂 Project Structure

```bash
eboxai/
├── backend/
│   ├── routers/          # API Endpoints (Inbox, Agent, Prompts)
│   ├── services/         # Business Logic (LLM, Email Processing)
│   ├── training/         # Model Training & evaluation pipeline
│   ├── scripts/          # Data seeding & utility scripts
│   ├── data/             # Mock Data & Default Prompts
│   └── main.py           # Application Entry Point
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI Components
│   │   ├── pages/        # Main Views (Inbox, Dashboard, Agent)
│   │   └── api.ts        # Backend Integration
│   └── tailwind.config.js # Design System Configuration
└── README.md
```

---

## ☁️ Deployment Troubleshooting

### 1. Agent says "I am a mock agent"
This happens if the `GEMINI_API_KEY` is missing.
- **Vercel/Render**: Go to your project settings -> Environment Variables.
- Add `GEMINI_API_KEY` with your Google Gemini API key.
- Redeploy if necessary.

### 2. "Meetings" or "Follow-ups" tabs are empty
On platforms like Vercel/Render, the database starts empty. You need to seed it with demo data.
1. Deploy your backend.
2. Run the following command (replace with your backend URL):
   ```bash
   curl -X POST https://your-backend-url.onrender.com/seed
   ```
   Or simply visit `https://your-backend-url.onrender.com/docs`, find the `/seed` endpoint, and click "Try it out" -> "Execute".
3. Refresh your frontend. You should now see sample meetings and follow-ups.

---

## 🗺️ Roadmap

- [x] **Core Agent Engine**: Categorization, Extraction, Drafting.
- [x] **Modern UI**: Dark mode, Glassmorphism, Responsive layout.
- [x] **Agent Chat**: Context-aware Q&A with inbox data.
- [x] **Advanced Analytics**: Mission Control Dashboard with live feed.
- [x] **Meeting Prep**: AI-generated briefs and context.
- [x] **Real Email Integration**: Connect via Gmail API.
- [ ] **Voice Commands**: Control your agent with voice.
- [ ] **Multi-Agent Mode**: Specialized agents for different workflows (Sales, HR).

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

<div align="center">

**Made with ❤️ by [SharkGitz](https://github.com/sharkgitz)**

</div>
