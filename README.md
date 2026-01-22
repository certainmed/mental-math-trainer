# 🧠 Mental Math Trainer

![Project Status](https://img.shields.io/badge/status-active-success)
![Tech Stack](https://img.shields.io/badge/tech-Vanilla%20JS%20|%20HTML5%20|%20CSS3-blue)
![License](https://img.shields.io/badge/license-MIT-green)

A **Single Page Application (SPA)** designed to train mental arithmetic skills. Built with a focus on speed, precision, and progress tracking using standard **speedcubing metrics** (Ao5, Ao12).

## ✨ Key Features

### 1. Diverse Practice Modes
* **Basic Operations:** Multiplication, Addition, Subtraction, and Division.
* **Mixed Mode:** Randomizes all operations to train mental flexibility.
* **⚡ Chain Math (Flash Anzan):** A standout feature that flashes a sequence of numbers rapidly to train **working memory** alongside calculation skills.

### 2. Speedcubing-Style Analytics
Going beyond simple scores, this app uses advanced statistical metrics to measure consistency:
* **Ao5 (Average of 5):** Rolling average of the last 5 sessions (excluding the fastest & slowest times).
* **Ao12 (Average of 12):** Rolling average of the last 12 sessions for medium-term performance tracking.
* **Accuracy Graphs:** Visualizes percentage of correct answers per operation.
* **Error Analysis:** A history log of wrong answers to help review specific weaknesses.

### 3. Reference Tools
* **Power Table ($x^n$):** A dynamic exponentiation table utilizing `BigInt` for high-precision large number rendering.
* **Multiplication Table:** A standard 1-40 multiplication grid for quick reference.

### 4. Modern Design & UX
* **"Fresh Pastel" Theme:** A color palette designed to be easy on the eyes, reducing visual fatigue during long training sessions.
* **Non-Intrusive Input:** Auto-focus on input fields and full keyboard navigation support (Enter to submit).
* **Responsive:** Layout automatically adjusts for both Desktop and Mobile experiences.

---

## 🛠️ Tech Stack

This project is built using a **Pure Vanilla JavaScript** approach for maximum performance with zero framework overhead.

* **Frontend:** HTML5 (Semantic), CSS3 (Variables, Flexbox, Grid).
* **Logic:** JavaScript ES6+ (Centralized State Management).
* **Persistence:** LocalStorage API (Locally saves session history and user settings).
* **Timing:** `performance.now()` for millisecond-precision timing.

---

## 📂 Project Structure

```text
mental-math-trainer/
│
├── index.html      # Main Entry Point (SPA Structure)
├── styles.css      # Styling with CSS Variables & Responsive Design
├── app.js          # Application Logic (State, Math Logic, UI Rendering)
└── README.md       # Project Documentation
