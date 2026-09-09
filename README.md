# Skill2Career AI — JavaScript Edition

Skill2Career AI is a Node.js and Express career-guidance platform. It recommends career paths from education, interests and skills, calculates deterministic skill gaps, and uses Gemini to explain a personalized learning roadmap.

## Core principle

**The database is the source of truth for career requirements. AI is the personalization layer.** The weighted skill-gap engine always loads required skills from `careers`; Gemini only receives that verified context and may not add requirements or URLs.

## Features

- Guest-first assessment flow with no account or login required
- Profile onboarding, skills and proficiency capture
- Top-five recommendations: skill compatibility 60%, interests 25%, education 15% (assessment can add a capped five-point signal)
- Weighted proficiency skill gap, career explorer, resource/project catalog and progress-tracked roadmaps
- Gemini roadmap generator and contextual AI assistant, both rate-limited and failure-safe
- Admin-only CRUD API for career, skill and resource management
- In-memory profile and roadmap state, Gemini AI integration, Node tests and responsive Bootstrap UI

## Skill-gap calculation

Proficiency is Beginner=1, Intermediate=2, Advanced=3. For each required skill, contribution is `weight × min(student_level / required_level, 1)`. Match percentage is `sum(contributions) / sum(weights) × 100`. Fully met skills are strengths; lower-but-present skills are partial gaps; absent skills are missing. This is deterministic and works even when AI is unavailable.

## Setup

1. Install Node.js 20 or later.
2. Copy `.env.example` to `.env` and add your Gemini API key.
3. Install dependencies: `npm install`
4. Run locally: `npm run dev`
5. Run tests: `npm test`

Career paths and skills are loaded from the built-in catalog. One guest profile and generated roadmaps live in memory for the current server process and reset when the server restarts.

## Gemini

Create a Gemini API key, set `GEMINI_API_KEY`, and set `GEMINI_MODEL` to a model available to your account. You may also configure `GROQ_API_KEY` or `MISTRAL_API_KEY` with their corresponding model variables as fallbacks. The keys stay on the Node.js server; browser JavaScript never sees them. Providers are tried in Gemini, Groq, then Mistral order. If all services are unavailable, database-driven profile, matching, gap and progress features remain usable and AI endpoints return a friendly retry message.

## Demo admin

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` before running the seed command. The seed script creates that admin account without hard-coding a password. It adds, rather than deletes or overwrites, catalog data.

## Data model and API

Primary endpoints include `/api/student/*`, `/api/careers`, `/api/career-recommendations`, `/api/skill-gap/<id>`, and `/api/ai/*`.

## Architecture

`student profile → built-in career requirements → deterministic matching/skill gap → Gemini personalization → in-memory roadmap → UI`. AI roadmap output is schema-checked before saving, cached per student/career, and never called while loading the dashboard.

## Screenshots

Add project screenshots here after running the application. Future improvements include richer assessment questions, server-side CSRF protection for public deployment, pagination and an admin visual management interface.
