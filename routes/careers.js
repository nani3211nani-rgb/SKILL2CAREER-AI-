import { Router } from "express";
import { catalog, store } from "../services/store.js";
import { user, requireAuth } from "../middleware/auth.js";
import { analyzeSkillGap } from "../services/skillGap.js";
import { recommend } from "../services/careerMatch.js";
import { evaluateInterviewAnswer } from "../services/ai.js";
import {
  calculateCareerReadiness,
  analyzeProject,
  getRecommendedLearning,
  createInterviewSession,
  getInterviewQuestions,
  getInterviewQuestionContext,
  answerInterviewQuestion,
  getInterviewResults,
  buildActionPlan,
  buildCareerJourney,
  createLearningResource,
  searchYoutubeVideos,
} from "../services/careerReadinessService.js";
const r = Router();
r.get("/skills", (req, res) => res.json({ skills: catalog.skills }));
r.get("/careers/skills", (req, res) => res.json({ skills: catalog.skills }));
r.get("/careers", (req, res) => {
  const u = user(req);
  res.json({
    careers: catalog.careers.map((c) => ({
      ...c,
      matchScore: u ? analyzeSkillGap(u.skills, c.skills).matchScore : null,
    })),
  });
});
r.get("/careers/:id", (req, res) => {
  const career = store.findCareer(req.params.id);
  if (!career) return res.status(404).json({ error: "Career not found" });
  const u = user(req);
  res.json({
    career: {
      ...career,
      skillGap: u ? analyzeSkillGap(u.skills, career.skills) : null,
    },
  });
});
r.get("/career-recommendations", requireAuth, (req, res) => {
  const u = user(req);
  const all = recommend(u, catalog.careers, catalog.careers.length);
  res.json({
    recommendations: all.slice(0, 5),
    targetMatch: u.profileCompleted
      ? all.find((item) => item.career._id === u.careerGoalId) || null
      : null,
  });
});
r.get("/skill-gap/:id", requireAuth, (req, res) => {
  const career = store.findCareer(req.params.id);
  if (!career) return res.status(404).json({ error: "Career not found" });
  res.json({ skillGap: analyzeSkillGap(user(req).skills, career.skills) });
});
r.get("/career-readiness", requireAuth, (req, res) => {
  const u = user(req);
  if (!u.profileCompleted)
    return res.json({
      ready: false,
      message: "Complete your career assessment to calculate readiness.",
    });
  const target = store.findCareer(req.query.careerId || u.careerGoalId) ||
    u.customCareer || { name: u.careerGoal || "Career target", skills: [] };
  res.json({ ready: true, ...calculateCareerReadiness(u, target) });
});
r.get("/action-plan", requireAuth, (req, res) => {
  const u = user(req);
  if (!u.profileCompleted)
    return res.json({
      ready: false,
      message: "Complete your career assessment to calculate readiness.",
      nextFiveActions: [],
    });
  const target = store.findCareer(req.query.careerId || u.careerGoalId) ||
    u.customCareer || { name: u.careerGoal || "Career target", skills: [] };
  res.json({ ready: true, ...buildActionPlan(u, target) });
});
r.get("/career-journey", requireAuth, (req, res) =>
  res.json(buildCareerJourney()),
);
r.get("/learning-resources/:skill", requireAuth, async (req, res) => {
  const u = user(req);
  const skill = String(req.params.skill || "").trim();
  const level = String(req.query.level || "Beginner");
  const resource = createLearningResource(skill, level);
  const videos = await searchYoutubeVideos(skill, level, u.careerGoal || "");
  res.json({
    ...resource,
    videos: videos.videos || [],
    message: videos.message || "Learning resources are ready.",
  });
});
r.get("/youtube-learning/:skill", requireAuth, async (req, res) => {
  const skill = String(req.params.skill || "").trim();
  if (!skill)
    return res
      .status(400)
      .json({ error: "A skill is required to search learning videos." });
  const level = String(req.query.level || "Beginner");
  const career = user(req).careerGoal || "";
  const result = await searchYoutubeVideos(skill, level, career);
  res.json(result);
});
r.get("/resources", (req, res) => res.json({ resources: [] }));
r.post("/project/analyze", requireAuth, (req, res) => {
  try {
    const u = user(req),
      payload = req.body || {},
      project = payload.project || payload;
    if (
      !String(project.name || "").trim() ||
      !String(project.description || "").trim()
    )
      return res
        .status(400)
        .json({ error: "Project name and description are required." });
    const career = store.findCareer(payload.careerId || u.careerGoalId) ||
      u.customCareer || { name: u.careerGoal || "Career target", skills: [] };
    const result = analyzeProject(project, career);
    result.projectName = String(project.name).trim();
    result.githubUrl = project.githubUrl || "";
    result.targetCareer = career.name;
    u.projectAnalyses = u.projectAnalyses || [];
    u.projectAnalyses.push(result);
    u.updatedAt = new Date();
    store.projectAnalyses.set(`${u._id}:${Date.now()}`, result);
    store.saveStudent(u);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
r.post("/interview/start", requireAuth, (req, res) => {
  try {
    const u = user(req),
      career =
        store.findCareer(req.body?.careerId || u.careerGoalId) ||
        u.customCareer,
      careerName = req.body?.career || career?.name || u.careerGoal || "";
    if (!careerName)
      return res
        .status(400)
        .json({ error: "Choose a career before starting an interview." });
    const session = createInterviewSession({
      career: careerName,
      difficulty: req.body?.difficulty || "Intermediate",
      type: req.body?.type || "Mixed",
    });
    res.json(session);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
r.get("/interview/preview", requireAuth, (req, res) => {
  try {
    const u = user(req),
      career =
        store.findCareer(req.query.careerId || u.careerGoalId) ||
        u.customCareer,
      careerName = career?.name || u.careerGoal || "";
    if (!careerName)
      return res
        .status(400)
        .json({ error: "Choose a career to preview interview questions." });
    const difficulty = String(req.query.difficulty || "Intermediate");
    const type = String(req.query.type || "Technical");
    res.json({
      career: careerName,
      difficulty,
      type,
      questions: getInterviewQuestions({
        career: careerName,
        difficulty,
        type,
      }),
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
r.post("/interview/answer", requireAuth, async (req, res) => {
  try {
    const sessionId = String(req.body?.sessionId || req.query.sessionId || ""),
      answerText = String(req.body?.answer || "");
    if (answerText.trim().length < 10)
      return res.status(400).json({
        error: "Please provide a meaningful answer before submitting.",
      });
    const context = getInterviewQuestionContext(sessionId);
    let evaluation = null,
      evaluationNotice = "";
    try {
      evaluation = await evaluateInterviewAnswer({
        ...context,
        answer: answerText,
      });
      evaluation.source = "ai";
    } catch {
      evaluationNotice =
        "AI analysis is temporarily unavailable. Showing a deterministic evaluation of your answer.";
    }
    const answer = answerInterviewQuestion(sessionId, {
      answer: answerText,
      evaluation,
    });
    answer.evaluationNotice = evaluationNotice;
    if (answer.complete) {
      const u = user(req),
        interview = getInterviewResults(sessionId);
      u.interviewScores = u.interviewScores || [];
      u.interviewCommunicationScores = u.interviewCommunicationScores || [];
      u.interviewScores.push({
        score: interview.averageScore,
        targetCareer: interview.career,
      });
      u.interviewCommunicationScores.push({
        score: interview.communicationScore,
        targetCareer: interview.career,
      });
      u.updatedAt = new Date();
      store.saveStudent(u);
    }
    res.json(answer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
r.get("/interview/results", requireAuth, (req, res) => {
  const sessionId = String(req.query.sessionId || "");
  const result = getInterviewResults(sessionId);
  res.json(result);
});
export default r;
