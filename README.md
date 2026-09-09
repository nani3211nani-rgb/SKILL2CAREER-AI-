# Skill2Career AI

Skill2Career AI is a Node.js and Express career-guidance website. It collects a student's education level, interests, current skills, and target career, then combines deterministic skill-gap matching with AI-generated assessment results and learning roadmaps.

## Current website flow

1. Open the home page and choose **Start skill assessment**.
2. Complete onboarding with a broad education level, specialization, interest, current skills, and career target.
3. Choose skills from the curated list or search and add a custom skill. Selected skills appear as interactive emoji chips with hover and selection animations.
4. Select one of the built-in career paths or type a career that is not listed.
5. Review the AI assessment, career fit, strengths, missing skills, and next steps.
6. Generate a roadmap and mark roadmap steps complete.

The main browser routes are `#/`, `#/onboarding`, `#/careers`, `#/career/<id>`, `#/dashboard`, `#/assessment-results`, and `#/roadmap`.

## Features

- Broad education choices including secondary school, high school, undergraduate, postgraduate, doctorate, vocational training, and professional certification.
- Curated career catalog covering technology, data, design, marketing, finance, management, accounting and CA, law, healthcare, education, HR, architecture, electrical, electronics, mechanical, civil, chemical, mining, robotics, environmental, and other paths.
- Free-form interests and custom career targets for cases not covered by the catalog.
- Searchable skill picker with emoji feedback, animated skill chips, and custom skill entry.
- Deterministic weighted skill-gap analysis that works without AI.
- Career recommendations based on skills, interests, and education.
- AI assessment, career suggestions, roadmap generation, and career chat.
- Responsive Bootstrap interface with client-side HTML escaping for rendered user values.
- In-memory guest profile, roadmap, and conversation storage.

## Matching and skill gaps

Proficiency levels are `Beginner`, `Intermediate`, and `Advanced`. Required career skills have weights and levels. The skill-gap service calculates each contribution as:

`weight * min(student_level / required_level, 1)`

The match percentage is the total contribution divided by the total required weight. Fully met skills are strengths, lower-but-present skills are partial gaps, and absent skills are missing. Custom skills are preserved in the profile and sent to AI analysis; the profile API accepts up to 50 skills.

## Setup

Requirements:

- Node.js 20 or later
- An optional AI provider key for AI assessment and roadmap features

Install and run:

```bash
npm install
npm run dev
```
The website is available at `http://localhost:3000` unless `PORT` is set. Run the tests with:

```bash
npm test
```

The server stores catalog data, the guest profile, roadmaps, and conversations in memory. Restarting the server resets that state.

## Environment variables

Create a `.env` file in the project root. At least one provider can be configured:

```env
PORT=3000
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-3.6-flash
GROQ_API_KEY=your_key
GROQ_MODEL=openai/gpt-oss-120b
MISTRAL_API_KEY=your_key
MISTRAL_MODEL=mistral-small-latest
```

AI providers are tried in this order: Gemini, Groq, then Mistral. Keys remain on the Node.js server and are never sent to browser JavaScript. If all providers are unavailable, deterministic career matching and skill-gap features continue to work.

## API overview

- `GET /api/health` - server and AI-provider status
- `GET /api/careers` - built-in career catalog and match scores
- `GET /api/careers/:id` - career details and skill gap
- `GET /api/skills` - skill catalog
- `PUT /api/student/profile` - save education, interests, career target, and skills
- `GET /api/student/profile` - read the current guest profile
- `GET /api/career-recommendations` - deterministic career recommendations
- `GET /api/skill-gap/:id` - deterministic skill-gap result
- `POST /api/ai/assessment` - AI assessment for the selected or custom career
- `POST /api/ai/career-suggestions` - AI career suggestions
- `POST /api/ai/generate-roadmap` - generate or retrieve a learning roadmap
- `GET /api/ai/roadmap` - read the current roadmap
- `PUT /api/ai/roadmap/:roadmapId/step/:stepId` - update roadmap progress
- `POST /api/ai/chat` - ask the career assistant a question

The API applies general rate limiting and a stricter limit to AI routes. Authentication is currently a guest-mode placeholder; `requireAuth` resolves to the in-memory guest profile and admin endpoints are disabled.

## Architecture

`browser onboarding -> student profile -> career catalog -> deterministic matching and skill gap -> AI assessment or roadmap -> progress UI`

Career requirements come from the built-in catalog. AI receives that verified context and the student's profile; it does not define the deterministic requirements. AI responses are schema-checked before assessment or roadmap data is used.

## Project structure

```text
config/       Environment configuration
middleware/   Guest authentication placeholder
public/       Website HTML, CSS, and browser JavaScript
routes/       Student, career, and AI API routes
services/     Catalog, matching, skill-gap, storage, and AI services
tests/        Node.js tests
server.js     Express application entry point
```