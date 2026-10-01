# Skill2Career AI — Career Readiness & Skill-Gap Platform

## Problem

Students often receive generic career recommendations but do not know exactly which skills they are missing or how to become job-ready.

## Solution

Skill2Career AI combines a deterministic skill-gap engine with AI-assisted guidance, resume analysis, mock interviews, learning recommendations, and a dynamic roadmap. The focus is not just discovering a career, but becoming ready for it.

## Features

- Career Assessment and best-fit matching
- Deterministic Career Matching
- Skill Gap Analysis
- Career Readiness Score
- Resume Analyzer
- Project Analyzer
- Role-specific Mock Interview
- Personalized Action Plan
- Detailed Career Roadmap
- Roadmap download as a structured, printable PDF report
- AI YouTube Learning Recommendations
- Career Journey flow
- Responsive homepage with interactive feature chips
- Per-browser temporary profile sessions

## Privacy

- No database is used.
- Each browser receives an isolated temporary session using an HttpOnly cookie.
- Student profile, roadmap, interview, and analysis data is kept in memory only.
- Resume files are not permanently stored.
- Interview conversations are not permanently stored.
- Sessions expire after 24 hours and restarting the server resets temporary data.
- The homepage and Resume Analyzer explain the temporary-data model in plain language.

## Tech Stack

- Node.js
- Express
- Bootstrap and custom responsive UI in the static/public layer
- In-memory session storage with cookie-based visitor isolation
- AI provider fallback: Gemini, Groq, Mistral
- Optional YouTube Data API for learning video discovery
- Render Blueprint deployment via `render.yaml`

## Environment Variables

```env
PORT=3000
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-3.6-flash
GROQ_API_KEY=your_key
GROQ_MODEL=openai/gpt-oss-120b
MISTRAL_API_KEY=your_key
MISTRAL_MODEL=mistral-small-latest
YOUTUBE_API_KEY=your_key
```

All AI providers are optional. If an AI provider or YouTube is not configured, the app continues to work with deterministic analysis and clear fallback messages instead of inventing results or links.

## Website Views

The browser app is served from `/` and uses hash navigation:

- `#/` — Homepage and career overview
- `#/assessment` — Education, interests, career target, and skill proficiency form
- `#/career-journey` — Match, readiness, skill gaps, action plan, and roadmap
- `#/resume-analysis` — PDF, DOCX, or TXT resume analysis
- `#/mock-interview` — Role-specific interview preview and practice

The homepage includes interactive feature chips for career matching, skill gaps, learning videos, resume insights, and mock interviews. The site-wide footer includes the project development credit for Poorna Chander, Srinidhi, and Shiwani from B.Com (CA) 3rd Year at VJIAS.

## API Overview

- `GET /api/health`
- `GET /api/careers`
- `GET /api/careers/:id`
- `GET /api/skill-gap/:id`
- `GET /api/career-readiness`
- `GET /api/action-plan`
- `GET /api/career-journey`
- `GET /api/learning-resources/:skill`
- `GET /api/youtube-learning/:skill`
- `POST /api/project/analyze`
- `POST /api/ai/analyze-resume`
- `POST /api/interview/start`
- `POST /api/interview/answer`
- `GET /api/interview/results`
- `POST /api/ai/assessment`
- `POST /api/ai/generate-roadmap`
- `GET /api/ai/roadmap`
- `POST /api/ai/chat`

Protected API requests are automatically associated with the current browser session.

## Architecture

`Assess -> find skill gap -> learn -> practice -> build -> interview -> reassess -> job-ready`

The deterministic skill-gap calculator remains the source of truth for career requirements. AI is used to help explain results and generate guidance without overriding the verified catalog requirements.

## Setup

```bash
npm install
npm start
```

Open `http://localhost:3000` in a browser. For development with automatic restarts:

```bash
npm run dev
```

Run tests with:

```bash
npm test
```

## Render Deployment

The repository includes [render.yaml](render.yaml) with the production configuration:

- Build command: `npm install`
- Start command: `npm start`
- Health check: `/api/health`
- Automatic deploys from the `main` branch

Create a Render Blueprint from the repository, then add any optional AI and YouTube API keys as private Render environment variables. Never commit API keys to the repository.

The app remains session-based and privacy-first. It does not require a database, and restarting the server resets all temporary profile and interview state.
