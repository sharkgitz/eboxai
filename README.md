# 📧 eBoxAI: The Prompt-Driven Email Agent

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-v3.9+-blue.svg)
![React](https://img.shields.io/badge/react-v18+-61DAFB.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi)

> **Transform your inbox from a chore into a command center.**  
> eBoxAI uses advanced LLMs to categorize, summarize, and draft replies for your emails, all controlled by your custom prompts.

---

## ✨ Features

### 🧠 Prompt Brain
**You are in control.** Customize exactly how the agent "thinks" by editing natural language prompts. Tell it to prioritize emails from your boss or ignore newsletters about sales.

### 🏷️ Auto-Categorization
Automatically tags incoming emails with smart categories:
- **🔴 Important**: Urgent work emails, deadlines.
- **🔵 Newsletter**: Weekly digests, industry news.
- **🟡 To-Do**: Actionable items requiring your attention.
- **⚪ Spam**: Promotional offers and junk.

### 📝 Action Extraction & Drafting
- **Smart Extraction**: Detects tasks, deadlines, and meetings automatically.
- **Auto-Drafting**: Generates context-aware reply drafts for you to review and send.

### 💬 Agent Chat
**Talk to your inbox.** Ask questions like:
- *"What is the most urgent thing I need to do today?"*
- *"Summarize the email from John about the project."*
- *"Draft a polite decline to the invitation."*

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Backend** | Python, FastAPI, SQLAlchemy, Google Gemini API |
| **Frontend** | React, Vite, Tailwind CSS, Framer Motion |
| **Database** | SQLite (Local & Fast) |
| **Icons** | Lucide React |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+)
- **Python** (v3.9+)
- **Google Gemini API Key** (Optional, for live LLM features)

### 1️⃣ Backend Setup
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
*API will be live at `http://localhost:8000`*

### 2️⃣ Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*UI will be live at `http://localhost:5173`*

---

## 📖 Usage Guide

1.  **Load Inbox**: Click the **Refresh** icon 🔄 to load the mock inbox.
2.  **Run Agent**: Hit **Run Agent** ▶️ to categorize and process all emails.
3.  **Review**: Click any email to see AI insights, action items, and drafts.
4.  **Chat**: Switch to the **Agent** tab to converse with your email data.

---

## 🎨 Customization

- **Prompts**: Edit `backend/data/default_prompts.json` or use the **Brain** tab in the UI.
- **Mock Data**: Modify `backend/data/mock_inbox.json` to test different scenarios.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Made with ❤️ by [SharkGitz](https://github.com/sharkgitz)
