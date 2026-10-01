# Skill2Career AI

## Career Readiness and Skill-Gap Platform

**Developed by:** Poorna Chander, Srinidhi, and Shiwani  
**Programme:** B.Com (CA), 3rd Year  
**Institution:** VJIAS

---

## 1. Project Overview

Skill2Career AI is a web-based career readiness platform for students who need more than a generic career suggestion. It compares a student's education, interests, selected skills, and proficiency levels with career requirements, then turns the result into practical next steps.

The platform connects career discovery with preparation:

`Assess -> Match -> Find gaps -> Learn -> Improve resume -> Practise interview -> Follow roadmap`

The goal is to help a student understand:

- Which career direction fits the current profile
- Which skills are strong, partial, or missing
- What evidence should be built next
- How ready the student is for the selected career
- How to improve through learning, resume work, and interview practice

---

## 2. Problem Statement

Many students receive career recommendations without knowing what to do next. Common problems include:

- Career advice that is too general
- No comparison between current skills and role requirements
- No clear skill-gap priority
- Resumes that do not show measurable evidence
- Low confidence during interviews
- No connected plan from assessment to job readiness

Skill2Career AI addresses these problems through one guided workflow.

---

## 3. Main Objectives

1. Identify suitable career paths from a student's profile.
2. Calculate skill gaps using a verified career skill catalogue.
3. Provide a readiness score based on available evidence.
4. Analyze resume content without permanently storing the uploaded file.
5. Provide role-specific mock interview questions and feedback.
6. Generate a clear action plan and detailed roadmap.
7. Support learning discovery through optional YouTube results.
8. Keep the platform simple, responsive, and privacy-conscious.

---

## 4. Major Features

### Career Assessment

Students enter their education, specialization, interests, career target, skills, and proficiency levels. The platform calculates a career match and identifies missing or partially matched skills.

### Career Journey

The journey view combines:

- Career match score
- Overall readiness score
- Technical and evidence-based category scores
- Strengths
- Required skills
- Priority actions
- Roadmap phases

### Resume Analyzer

Students can upload a PDF, DOCX, or TXT resume. The platform extracts resume text in memory and reports:

- Skills found
- Education
- Experience
- Projects
- Certifications
- Achievements
- Missing resume sections
- Career-relevant skill coverage
- Improvement recommendations

### Mock Interview

Students select a career and difficulty level, preview questions, submit answers, and receive feedback. The system supports AI evaluation when configured and deterministic feedback when AI is unavailable.

### Detailed Roadmap

The roadmap converts skill gaps into clear phases. Each phase can include:

- Skill focus
- Explanation
- Tasks
- Evidence to build
- Project direction
- Learning resources

The roadmap can be opened as a professionally designed, printable PDF report. The report contains real text, sections, navigation links, profile details, scores, and roadmap phases rather than being a screenshot.

### Learning Recommendations

The platform can search for relevant YouTube learning videos when a YouTube API key is configured. Without the key, it displays a clear fallback message instead of creating fake links.

### Responsive Interface

The homepage uses a clean visual layout with interactive feature chips for:

- Career match
- Skill gaps
- Learning videos
- Resume insights
- Mock interview

The interface is designed for desktop and mobile screens.

---

## 5. User Workflow

### Step 1: Open the Homepage

The student sees the purpose of the platform and can start the assessment.

### Step 2: Complete Assessment

The student enters education, interests, career target, and current skills.

### Step 3: View Career Match

The platform compares the student profile with the selected career requirements.

### Step 4: Review Readiness

The student sees strengths, missing skills, priority actions, and readiness categories.

### Step 5: Analyze Resume

The student uploads a resume and receives evidence-based recommendations.

### Step 6: Practise Interview

The student previews and answers role-specific mock interview questions.

### Step 7: Follow the Roadmap

The student follows the roadmap phases and downloads a structured roadmap report.

---

## 6. Technical Architecture

### Frontend

- HTML5
- CSS3
- Bootstrap 5 and Bootstrap Icons
- Vanilla JavaScript
- Responsive single-page navigation using hash routes

### Backend

- Node.js
- Express
- Express rate limiting
- Helmet security headers
- Multer for in-memory file uploads
- Mammoth for DOCX text extraction
- PDF parsing for PDF resumes

### Data and Privacy

The application does not use a database.

Each browser receives an isolated temporary profile through an HttpOnly session cookie. Profile, roadmap, interview, and analysis data is stored in server memory only. Sessions expire after 24 hours, and restarting the server clears temporary data.

This design is useful for demonstrations and privacy-conscious session-based use. It is not intended to provide permanent account storage.

### AI Provider Fallback

The application can use Gemini, Groq, or Mistral. If one provider is unavailable, the service tries the next configured provider. If no provider is configured, deterministic analysis and user-friendly fallback messages keep the core website usable.

---

## 7. Project Structure

```text
config/              Environment configuration
middleware/          Session and request middleware
routes/              Student, career, and AI API routes
services/             Matching, readiness, AI, storage, and skill-gap logic
public/               Main website HTML, CSS, and JavaScript
static/               Supporting legacy/static assets
tests/                Automated career readiness and skill-gap tests
render.yaml           Render deployment configuration
server.js             Express application entry point
README.md             Developer setup and API reference
PROJECT_DOCUMENTATION.md  Presentation and project handout
```

---

## 8. Key API Areas

- `GET /api/health` - Server and provider status
- `GET /api/careers` - Career catalogue
- `GET /api/career-readiness` - Readiness calculation
- `GET /api/action-plan` - Recommended next actions
- `PUT /api/student/profile` - Student profile update
- `POST /api/ai/assessment` - Career assessment result
- `POST /api/ai/analyze-resume` - Resume analysis
- `POST /api/interview/start` - Start interview session
- `POST /api/interview/answer` - Submit interview answer
- `GET /api/ai/roadmap` - Read saved roadmap
- `POST /api/ai/generate-roadmap` - Generate roadmap
- `POST /api/ai/chat` - Career guidance chat

---

## 9. Running the Project

### Requirements

- Node.js 20 or newer recommended
- npm
- Optional AI or YouTube API keys

### Install and Run

```bash
npm install
npm start
```

Open:

```text
http://localhost:3000
```

For development with automatic restart:

```bash
npm run dev
```

Run automated tests:

```bash
npm test
```

---

## 10. Render Deployment

The repository includes `render.yaml` for deployment.

- Runtime: Node.js
- Build command: `npm install`
- Start command: `npm start`
- Health check: `/api/health`
- Automatic deploys: enabled from the `main` branch

Optional API keys should be added as private environment variables in Render. They must never be committed to Git.

---

## 11. Presentation Demonstration Plan

A short demonstration can follow this order:

1. Introduce the problem of generic career advice.
2. Show the homepage and interactive feature chips.
3. Complete a sample assessment for a career such as Data Analyst.
4. Show the match score, skill gaps, and readiness result.
5. Open the Resume Analyzer and explain evidence-based extraction.
6. Start a Mock Interview and submit a sample answer.
7. Open the roadmap and explain the phases, tasks, and evidence.
8. Download the professional roadmap PDF.
9. Explain the temporary session model and per-browser data isolation.
10. Close with the project team and VJIAS credit.

### Suggested Closing Statement

> Skill2Career AI does not stop at recommending a career. It shows the student what to improve, how to practise, what evidence to build, and how to track progress toward career readiness.

---

## 12. Project Strengths

- Combines deterministic analysis with optional AI assistance
- Provides a complete student workflow instead of one isolated tool
- Uses clear fallback behavior when external services are unavailable
- Prevents different browser sessions from sharing profile data
- Produces a structured roadmap report suitable for saving or presenting
- Works without a database for simple demonstrations and temporary sessions
- Includes responsive design for desktop and mobile use

---

## 13. Team Credit

**Developed by:**

- Poorna Chander
- Srinidhi
- Shiwani

**B.Com (CA), 3rd Year**  
**VJIAS**
