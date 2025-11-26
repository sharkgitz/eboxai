# Prompt-Driven Email Productivity Agent

An intelligent, AI-powered email agent that categorizes emails, extracts action items, and drafts replies based on user-defined prompts.

## Features

- **Prompt Brain**: Customize how the agent thinks by editing natural language prompts for categorization, extraction, and drafting.
- **Auto-Categorization**: Automatically tags emails as Important, Newsletter, Spam, etc.
- **Action Extraction**: Detects tasks and deadlines from email bodies.
- **Agent Chat**: Chat with your inbox to ask questions like "What is urgent?" or "Draft a reply to Mom".
- **Mock Inbox**: Comes with a built-in mock inbox for demonstration.
- **Modern UI**: Built with React, Tailwind CSS, and Framer Motion for a premium experience.

## Tech Stack

- **Backend**: Python, FastAPI, SQLAlchemy, Google Gemini API
- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons
- **Database**: SQLite (local)

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- Google Gemini API Key (optional, falls back to Mock mode)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   # Windows
   .\venv\Scripts\activate
   # Mac/Linux
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. (Optional) Set up your Gemini API Key:
   - Copy `.env.example` to `.env`
   - Add your key: `GEMINI_API_KEY=your_key_here`
5. Run the server:
   ```bash
   uvicorn backend.main:app --reload
   ```
   The API will be available at `http://localhost:8000`.

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   The UI will be available at `http://localhost:5173`.

## Usage Guide

1. **Load Inbox**: On the Inbox page, click the "Refresh" icon to load the mock inbox data.
2. **Process Emails**: Click the "Play" button to run the agent on all emails. This will categorize them and extract action items.
3. **View Details**: Click on any email to see the extracted insights and generated drafts.
4. **Edit Prompts**: Go to the "Brain" tab to modify the prompts used by the agent.
5. **Chat with Agent**: Go to the "Agent" tab to ask free-form questions about your emails.

## Customization

You can modify the default prompts in `backend/data/default_prompts.json` or directly in the UI.
The mock data is located in `backend/data/mock_inbox.json`.
