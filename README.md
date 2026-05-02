# AceAI: Ultimate Interview Assistant 🚀

AceAI is a professional-grade, real-time AI interview preparation and guidance platform. It consists of a **Stealth Desktop Application** for live interviews and a **SaaS Dashboard** for managing your preparation.

> [!NOTE]
> This project has been migrated to **MySQL** for data storage and uses **JWT** for custom authentication.

## 🌟 Key Features

- **Live Transcription:** Captures and transcribes your interview audio in real-time.
- **Stealth Overlay:** An undetectable floating window that provides AI answers discreetly during calls (Invisible to Zoom, Teams, and Google Meet).
- **Screen Analysis (OCR):** Instantly captures your screen to solve coding problems or technical questions using GPT-4o Vision.
- **Resume-Aware AI:** Tailors answers specifically to your background, target company, and job description.
- **MySQL Backend:** Full control over your data with a dedicated Node.js API and MySQL database.

---

## 🛠️ Project Structure

- `/`: Main Electron Desktop Application (The "Live" tool).
- `/website`: SaaS Landing page and User Dashboard.
- `/server`: Node.js Backend with MySQL integration and JWT Auth.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MySQL Server](https://dev.mysql.com/downloads/installer/) (Running locally or on a server)
- An [OpenAI API Key](https://platform.openai.com/api-keys)

### 2. Installation
Run the following command in the **root** folder to install all dependencies:
```bash
npm install
cd website && npm install
cd ../server && npm install
cd ..
```

### 3. Database Setup
1. Create a MySQL database (e.g., `aceai_db`).
2. The tables will be **automatically created** the first time you run the server.

### 4. Setup Environment Variables
- Create a `.env` file in the `/server` directory:
  ```env
  PORT=5000
  MYSQL_HOST=localhost
  MYSQL_USER=root
  MYSQL_PASSWORD=your_password
  MYSQL_DATABASE=aceai_db
  JWT_SECRET=your_secret_key
  STRIPE_SECRET_KEY=your_stripe_key
  ```

### 5. Running the Project
```bash
node start-all.js
```
- **Desktop App UI:** http://localhost:5175
- **Marketing Website:** http://localhost:5176
- **Backend API:** http://localhost:5000

---

## 💻 Using the Desktop App

1. **Sign Up/Login:** Use the website to create an account.
2. **API Key:** Open the Desktop App, go to **Settings**, and paste your OpenAI API Key.
3. **Start Session:** Click **"Start Session"** to begin. The **Stealth Overlay** will appear automatically.
4. **Shortcuts:**
   - `Alt + A`: Capture Screen (Analyze coding problems/questions).
   - `Alt + H`: Show/Hide the Overlay.

---

## 🎨 Tech Stack

- **Frontend:** React, Tailwind CSS, Vite
- **Desktop Shell:** Electron.js
- **Backend:** Node.js, Express, MySQL (mysql2)
- **Authentication:** JWT (JSON Web Tokens) & Bcrypt
- **AI Integration:** OpenAI GPT-4o & Whisper

---

## 📦 Production Build
```bash
npm run build:electron
```

---
*Built for excellence. Ace your next big opportunity with AceAI.*
