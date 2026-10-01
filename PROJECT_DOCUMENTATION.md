# Skill2Career AI

## Career clarity, built for the next move.

**Career Readiness and Skill-Gap Platform**

**Developed by**<br>
Poorna Chander | Srinidhi | Shiwani

**B.Com (CA), 3rd Year | VJIAS**

---

## The idea

Students are often told which careers are popular, but not what they should do next. Skill2Career AI turns a student's current profile into a practical, evidence-led plan.

The platform connects career discovery with preparation:

> **Assess -> Match -> Find gaps -> Learn -> Improve -> Practise -> Follow the roadmap**

Instead of stopping at a career suggestion, Skill2Career AI helps a student understand the skills they already have, the skills they need to build, and the evidence they should create next.

### The problem we solve

- Career advice is often too general.
- Students cannot clearly see their skill gaps.
- Resumes may not show relevant evidence.
- Interview preparation is usually disconnected from the target career.
- Students need a simple path from confusion to action.

### Our answer

One guided experience for assessment, skill-gap analysis, resume improvement, interview practice, learning discovery, readiness scoring, and roadmap planning.

---

## A guided career journey

| Stage               | What the student gets                                                |
| ------------------- | -------------------------------------------------------------------- |
| **01 Discover**     | Education, interests, career target, skills, and proficiency profile |
| **02 Match**        | Best-fit career score with verified skill requirements               |
| **03 Understand**   | Strengths, partial gaps, missing skills, and readiness score         |
| **04 Improve**      | Resume analysis, learning direction, and action priorities           |
| **05 Practise**     | Role-specific mock interview questions and feedback                  |
| **06 Move forward** | A detailed roadmap with phases, tasks, evidence, and next actions    |

---

## What makes it useful

### Career Assessment

The student selects a target career and records current skills. The deterministic skill-gap engine compares the profile with the verified career catalogue.

### Career Journey

A single view brings together career match, readiness, strengths, required skills, priority actions, and the roadmap.

### Resume Analyzer

PDF, DOCX, and TXT resumes are analyzed in memory. The result identifies skills, projects, education, experience, certifications, missing sections, and improvement suggestions.

### Mock Interview

Students preview questions for their chosen role, answer them, and receive feedback on relevance, structure, examples, technical focus, and communication.

### Learning and Roadmap

Skill gaps become practical phases. Each phase explains what to learn, what to practise, and what evidence or project work to build. A professional roadmap report can be saved as a searchable, link-enabled PDF.

---

## Product experience

The interface is designed to feel clear and useful from the first screen:

- Responsive homepage for desktop and mobile
- Visual feature chips for career match, skill gaps, learning videos, resume insights, and mock interview
- Clean assessment form with searchable skills and proficiency levels
- Tabbed Career Journey for overview, actions, and roadmap
- Colored states, readable cards, focus states, and responsive layout
- Site-wide project credit for the student development team and VJIAS

---

## How the system works

```text
Student profile
      |
      v
Career catalogue + skill requirements
      |
      v
Deterministic skill-gap engine
      |
      +--> Career match and readiness
      +--> Resume evidence and recommendations
      +--> Interview practice and feedback
      +--> Learning suggestions
      +--> Detailed career roadmap
```

### Technology

- **Frontend:** HTML, CSS, Bootstrap, Bootstrap Icons, vanilla JavaScript
- **Backend:** Node.js and Express
- **Analysis:** Deterministic skill-gap and readiness services
- **Optional AI:** Gemini, Groq, and Mistral fallback providers
- **Files:** In-memory PDF, DOCX, and TXT resume processing
- **Deployment:** Render Blueprint with automatic deployment from `main`

---

## Privacy by design

The platform does not use a database.

Each browser receives an isolated temporary session through an HttpOnly cookie. Profile, roadmap, interview, and analysis data remains in server memory. Sessions expire after 24 hours, and restarting the server clears temporary data.

The product communicates this simply:

> **Your career plan. Not your data.**

AI and YouTube integrations are optional. When they are unavailable, the core assessment and deterministic analysis continue with clear fallback messages.

---

## Demonstration flow

A short presentation can be completed in five minutes:

1. Introduce the problem of generic career advice.
2. Open the homepage and show the visual feature chips.
3. Complete an example assessment for Data Analyst or another role.
4. Explain the career match, readiness score, strengths, and skill gaps.
5. Open Resume Analyzer and show the evidence-based recommendations.
6. Start Mock Interview and answer one role-specific question.
7. Open the Career Journey and explain the roadmap phases.
8. Download the professional roadmap PDF.
9. Close with the privacy model and project team credit.

### Presentation closing

> **Skill2Career AI does not only recommend a career. It shows the student what to improve, how to practise, what evidence to build, and how to move toward job readiness.**

---

## Running the project

```bash
npm install
npm start
```

Open `http://localhost:3000`.

Development mode:

```bash
npm run dev
```

Tests:

```bash
npm test
```

### Render

The repository includes `render.yaml`:

- Build: `npm install`
- Start: `npm start`
- Health check: `/api/health`
- Auto deploy: `main` branch

Private AI and YouTube keys should be configured only in Render environment variables.

---

## Team credit

**Poorna Chander**<br>
**Srinidhi**<br>
**Shiwani**

**B.Com (CA), 3rd Year**  
**VJIAS**
