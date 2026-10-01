# Skill2Career AI — AI-Powered Career Readiness & Skill-Gap Platform

## Problem

Students often receive generic career recommendations but do not know exactly which skills they are missing or how to become job-ready.

## Solution

Skill2Career AI combines a deterministic skill-gap engine with AI-assisted assessment, resume analysis, project analysis, mock interviews, learning recommendations, and a dynamic roadmap. The focus is not just discovery of a career but readiness for it.

## Features

- AI Career Assessment
- Deterministic Career Matching
- Skill Gap Analysis
- Career Readiness Score
- Resume Analyzer
- Project Analyzer
- AI Mock Interview
- Personalized Action Plan
- Dynamic Roadmap
- AI YouTube Learning Recommendations
- Skill Quiz support via the learning loop
- Skill Reassessment support in session data
- Career Journey flow
- Exhibition-friendly dashboard concepts

## Privacy

- No database is used.
- All student profile data is kept in memory for the current session.
- Resume files are not permanently stored.
- Interview conversations are not permanently stored.
- Restarting the server resets guest data.

## Tech Stack

- Node.js
- Express
- Bootstrap-powered UI in the static/public layer
- In-memory guest profile storage
- AI provider fallback: Gemini, Groq, Mistral
- Optional YouTube Data API for learning video discovery

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

YouTube is optional. If it is not configured, the app continues to work and shows a clear fallback message instead of inventing links.

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

## Architecture

`Assess -> find skill gap -> learn -> practice -> build -> interview -> reassess -> job-ready`

The deterministic skill-gap calculator remains the source of truth for career requirements. AI is used to help explain results and generate guidance without overriding the verified catalog requirements.

## Setup

```bash
npm install
npm run dev
```

Run tests with:

```bash
npm test
```

The app is designed to remain session-based and privacy-first. It does not require a database, and restarting the server resets all temporary profile and interview state.