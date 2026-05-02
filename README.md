# AceAI: Ultimate Interview Assistant 🚀

AceAI is a professional-grade, real-time AI interview preparation and guidance platform. It consists of a **Stealth Desktop Application** for live interviews and a **SaaS Dashboard** for managing your preparation.

## 🌟 Key Features

- **Live Transcription:** Captures and transcribes your interview audio in real-time.
- **Stealth Overlay:** An undetectable floating window that provides AI answers discreetly during calls (Invisible to Zoom, Teams, and Google Meet).
- **Screen Analysis (OCR):** Instantly captures your screen to solve coding problems or technical questions using GPT-4o Vision.
- **Resume-Aware AI:** Tailors answers specifically to your background, target company, and job description.
- **Multi-Language Support:** Works seamlessly in over 50+ languages.

---

## 🛠️ Project Structure

- `/`: Main Electron Desktop Application (The "Live" tool).
- `/website`: SaaS Landing page and User Dashboard.
- `/server`: Node.js Backend for payments, user profiles, and session history.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- An [OpenAI API Key](https://platform.openai.com/api-keys)

### 2. Installation
Run the following command in the **root** folder to install all necessary dependencies for the whole ecosystem:
```bash
npm install
cd website && npm install
cd ../server && npm install
cd ..
```

### 3. Setup Environment Variables
- Create a `.env` file in the `/server` directory (Refer to `.env.example`).
- Create a `.env` file in the `/website` directory if you want to use Supabase features.

### 4. Running the Project
The easiest way to start everything is using the helper script in the root directory:
```bash
node start-all.js
```
This will start:
- **Desktop App UI:** http://localhost:5175
- **Marketing Website:** http://localhost:5176
- **Backend API:** http://localhost:5000

---

## 💻 Using the Desktop App

1. **API Key:** Open the Desktop App, go to **Settings**, and paste your OpenAI API Key.
2. **Start Session:** Click **"Start Session"** to begin audio capture. The **Stealth Overlay** will appear automatically.
3. **Shortcuts:**
   - `Alt + A`: Capture Screen (Analyze coding problems/questions).
   - `Alt + H`: Show/Hide the Overlay.

---

## 🎨 Tech Stack

- **Frontend:** React, Tailwind CSS, Vite
- **Desktop Shell:** Electron.js
- **Backend:** Node.js, Express, Supabase (Auth/DB)
- **AI Integration:** OpenAI GPT-4o & Whisper
- **State Management:** Zustand

---

## 📦 Production Build

To build the desktop application for distribution:
```bash
npm run build:electron
```
The executable will be generated in the `/release` folder.

---
*Built for excellence. Ace your next big opportunity with AceAI.*
