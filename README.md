# AI Research Assistant

A production-ready, beautiful, and modern AI-powered Research Assistant application built using **Node.js/Express**, **Vanilla JavaScript (ES6)**, and the official **Google Gemini API** (`@google/genai` SDK).

The application allows users to search any research topic with optional context and generates a structured, five-section report:
1. **Executive Summary**
2. **Key Insights**
3. **Opportunities**
4. **Risks**
5. **Recommendations**

---

## Features
- **Structured Reports**: Clean division of generated AI contents into dedicated SaaS cards.
- **Vanilla Modern Design**: Ultra-responsive layout with sleek glassmorphism cards, micro-animations, and dynamic visual blobs.
- **Light & Dark Mode**: Persistent theme settings using local storage, adapting smoothly to system or user choice.
- **Live Counters & Auto-Resizing**: Built-in character limits (200 for Topic, 1000 for Context) with live tracking, and auto-growing textareas.
- **Document Utilities**: Download report instantly as a `.txt` file, copy markdown raw string to clipboard, or reset form.
- **Robust Error Handling**: Friendly error messages handling API timeouts, bad keys, rate limits (429), and validation.

---

## Project Structure
```text
research-assistant/
│
├── server.js              # Express app entrypoint & configuration
├── package.json           # Project dependencies & startup scripts
├── .env                   # Configuration variables (keys/ports)
├── .gitignore             # Ignored directories and local secrets
│
├── routes/
│   └── research.js        # Express routing and validation middleware
│
├── services/
│   └── geminiService.js   # Gemini 2.5 Flash SDK integrations
│
├── public/
│   ├── index.html         # Main dashboard layout (HTML5 semantic elements)
│   ├── style.css          # Core SaaS styling sheet (variables & animations)
│   └── script.js          # Dynamic UI controller & markdown list parser
│
└── README.md              # Installation and deployment documentation
```

---

## Installation & Setup

### 1. Clone or Extract Project
Make sure you are in the project's root folder:
```bash
cd research-assistant
```

### 2. Install Dependencies
Install all package dependencies including Express, dotenv, CORS, and the official Google Gen AI SDK:
```bash
npm install
```

### 3. Configure Environment Variables
Create a file named `.env` in the root folder of the project (if it doesn't already exist) and define your Gemini API key and server port:
```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
PORT=3000
```
> **Note**: Obtain your API Key from the [Google AI Studio](https://aistudio.google.com/).

### 4. Run the Application

#### Development Mode (with hot-reload)
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

Once running, navigate to [http://localhost:3000](http://localhost:3000) in your web browser.

---

## Project Architecture
```mermaid
graph TD
    User[Web Browser Client] -->|POST /api/research| Server[Express Server]
    Server -->|Validation & Route Handler| Route[research.js Route]
    Route -->|Call generateReport| Service[geminiService.js Service]
    Service -->|SDK Client initialized| Gemini[Google Gemini 2.5 Flash API]
    Gemini -->|Returns Report Text| Service
    Service -->|Return Raw Markdown| Route
    Route -->|{"success": true, "report": "..."}| Server
    Server -->|Send JSON Response| User
    User -->|Client-side Parser| Render[Display parsed sections inside Glassmorphism Cards]
```
