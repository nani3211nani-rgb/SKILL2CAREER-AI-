import { Router } from "express";
import { catalog, store } from "../services/store.js";
import { requireAuth, user } from "../middleware/auth.js";
import { analyzeSkillGap } from "../services/skillGap.js";
import { rankResumeCareers } from "../services/careerMatch.js";
import {
  careerSuggestions,
  chat,
  extractResumeWithAI,
} from "../services/ai.js";
import {
  analyzeResumeText,
  validateResumeInput,
} from "../services/careerReadinessService.js";
import multer from "multer";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
const r = Router();
r.post("/assessment", (req, res) => {
  try {
    const u = user(req),
      career =
        store.findCareer(req.body?.careerId || u.careerGoalId) ||
        u.customCareer;
    if (!career)
      return res.status(400).json({ error: "Choose a career target first." });
    if (!u.education?.degree || !u.skills?.length)
      return res.status(400).json({
        error:
          "Add your education and at least one skill before completing the assessment.",
      });
    const gap = analyzeSkillGap(u.skills, career.skills || []),
      result = {
        summary: `Your profile contains ${u.skills.length} selected skills for ${career.name}.`,
        careerMatch: {
          title: career.name,
          score: gap.matchScore,
          reason:
            "Calculated from your selected skills and stated proficiency levels.",
        },
        strengths: gap.strengths.map((skill) => skill.skillName),
        missingSkills: [...gap.missingSkills, ...gap.partialGaps].map(
          (skill) => ({
            name: skill.skillName,
            priority: skill.importance || "Medium",
          }),
        ),
        nextSteps: gap.missingSkills.map(
          (skill) => `Build evidence for ${skill.skillName}.`,
        ),
      };
    result.verifiedMatch = {
      score: gap.matchScore,
      strengths: gap.strengths.map((skill) => skill.skillName),
      partialGaps: gap.partialGaps.map((skill) => skill.skillName),
      missingSkills: gap.missingSkills.map((skill) => skill.skillName),
      requiredSkills: gap.requiredSkills,
    };
    u.assessment = {
      ...result,
      careerId: career._id,
      answers: {
        education: u.education,
        interests: u.interests,
        skills: u.skills,
      },
      createdAt: new Date(),
    };
    u.profileCompleted = true;
    store.saveStudent(u);
    res.json({ assessment: result });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
r.post("/career-suggestions", async (req, res) => {
  try {
    const u = user(req);
    const result = await careerSuggestions({
      student: {
        education: u.education,
        interests: u.interests,
        skills: u.skills,
      },
      possibleCareers: catalog.careers.map((c) => ({
        name: c.name,
        requirements: c.skills,
      })),
    });
    res.json(result);
  } catch (e) {
    res.status(503).json({ error: e.message });
  }
});
r.post("/generate-roadmap", requireAuth, (req, res) => {
  try {
    const u = user(req),
      career =
        store.findCareer(req.body?.careerId || u.careerGoalId) ||
        u.customCareer;
    if (!u.profileCompleted)
      return res
        .status(400)
        .json({ error: "Complete your assessment to generate your roadmap." });
    if (!career) return res.status(404).json({ error: "Career not found" });
    const gap = analyzeSkillGap(u.skills, career.skills || []),
      gaps = [...gap.missingSkills, ...gap.partialGaps],
      steps = gaps.map((skill, index) => ({
        stepId: String(index + 1),
        stepNumber: index + 1,
        title: `Build ${skill.skillName}`,
        skill: skill.skillName,
        description: `Your assessment shows ${skill.studentLevel || "no recorded"} proficiency; the target requires ${skill.requiredLevel || "strong evidence"}.`,
        estimatedStage: "Next",
        tasks: [
          `Study ${skill.skillName} at the required level`,
          `Apply ${skill.skillName} in a project`,
        ],
        projects: [],
        resources: [],
        status: "not_started",
      }));
    if (u.resumeAnalysis?.missingSections?.length)
      steps.push({
        stepId: String(steps.length + 1),
        stepNumber: steps.length + 1,
        title: "Strengthen resume evidence",
        skill: "Resume",
        description: `Your analysis identified: ${u.resumeAnalysis.missingSections.join(", ")}.`,
        tasks: u.resumeAnalysis.recommendations || [],
        status: "not_started",
      });
    if (!u.projectAnalyses?.length)
      steps.push({
        stepId: String(steps.length + 1),
        stepNumber: steps.length + 1,
        title: "Analyze a role-relevant project",
        skill: "Project evidence",
        description: `Submit a project to measure evidence for ${career.name}.`,
        tasks: [
          "Describe a project you built",
          "List technologies you actually used",
        ],
        status: "not_started",
      });
    if (u.projectAnalyses?.length) {
      const project = u.projectAnalyses.at(-1);
      if (project.projectScore < 75)
        steps.push({
          stepId: String(steps.length + 1),
          stepNumber: steps.length + 1,
          title: `Improve ${project.projectName}`,
          skill: "Project evidence",
          description: `Your submitted project scored ${project.projectScore} and demonstrated ${project.skillsDemonstrated.join(", ") || "no target skills"}.`,
          tasks: project.improvementSuggestions,
          status: "not_started",
        });
    }
    if (u.interviewScores?.length) {
      const scores = u.interviewScores
        .filter(
          (item) =>
            typeof item === "number" || item.targetCareer === career.name,
        )
        .map((item) => (typeof item === "number" ? item : item.score));
      const score = scores.length
        ? Math.round(
            scores.reduce((sum, value) => sum + value, 0) / scores.length,
          )
        : null;
      if (score !== null && score < 75)
        steps.push({
          stepId: String(steps.length + 1),
          stepNumber: steps.length + 1,
          title: "Improve interview performance",
          skill: "Interview practice",
          description: `Your completed interview answers average ${score}.`,
          tasks: [
            "Review the recorded answer feedback",
            "Practice another interview using the identified weak areas",
          ],
          status: "not_started",
        });
    }
    if (!steps.length)
      steps.push({
        stepId: "1",
        stepNumber: 1,
        title: "Extend your strongest skills",
        skill: gap.strengths.map((item) => item.skillName).join(", "),
        description: `Your recorded skills meet the listed requirements for ${career.name}. Add project and interview evidence to continue.`,
        tasks: ["Analyze a project you built", "Complete a mock interview"],
        status: "not_started",
      });
    const doc = {
      _id: store.newId(),
      studentId: u._id,
      careerId: career._id,
      matchScore: gap.matchScore,
      strengths: gap.strengths.map((x) => x.skillName),
      skillGaps: gaps.map((x) => x.skillName),
      steps,
      createdAt: new Date(),
    };
    store.saveRoadmap(doc);
    res.status(201).json({ roadmap: doc });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
r.get("/roadmap", requireAuth, (req, res) => {
  const u = user(req);
  if (!u.profileCompleted)
    return res.json({
      roadmap: null,
      message: "Complete your assessment to generate your roadmap.",
    });
  const saved = store.findRoadmap(u._id);
  const doc =
    saved && new Date(saved.createdAt) >= new Date(u.updatedAt || 0)
      ? saved
      : null;
  res.json({
    roadmap: doc
      ? {
          ...doc,
          progress: doc.steps.length
            ? Math.round(
                (doc.steps.filter((s) => s.status === "completed").length /
                  doc.steps.length) *
                  100,
              )
            : 0,
        }
      : null,
  });
});
r.put("/roadmap/:roadmapId/step/:stepId", requireAuth, (req, res) => {
  const doc = store.findRoadmap(user(req)._id),
    step = doc?.steps.find((s) => s.stepId === req.params.stepId);
  if (!step || doc._id !== req.params.roadmapId)
    return res.status(404).json({ error: "Roadmap or step not found" });
  if (!["not_started", "in_progress", "completed"].includes(req.body?.status))
    return res.status(400).json({ error: "Invalid status" });
  step.status = req.body.status;
  res.json({ message: "Progress updated" });
});
r.post("/chat", requireAuth, async (req, res) => {
  try {
    const question = String(req.body?.question || "").trim(),
      u = user(req);
    if (!question || question.length > 1000)
      return res
        .status(400)
        .json({ error: "Enter a question under 1000 characters." });
    const career = catalog.careers.find((c) => c.name === u.careerGoal),
      response = await chat(
        {
          student: u,
          careerRequirements: career?.skills || [],
          roadmap: store.findRoadmap(u._id),
        },
        question,
      );
    store.saveConversation({
      studentId: u._id,
      question,
      response,
      createdAt: new Date(),
    });
    res.json({ response });
  } catch (e) {
    res.status(503).json({ error: e.message });
  }
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});
const uploadResume = (req, res, next) =>
  upload.single("resume")(req, res, (error) => {
    if (error)
      return res.status(400).json({
        error:
          "Could not read this file. Please upload a valid PDF, DOCX or TXT resume.",
      });
    next();
  });
r.post("/analyze-resume", requireAuth, uploadResume, async (req, res) => {
  let parser;
  try {
    const file = req.file;
    if (!file)
      return res
        .status(400)
        .json({ error: "Choose a resume file before analyzing." });
    const fileName = String(file.originalname || "").toLowerCase();
    let text = "";
    if (fileName.endsWith(".txt")) text = file.buffer.toString("utf8");
    else if (fileName.endsWith(".docx"))
      text = (await mammoth.extractRawText({ buffer: file.buffer })).value;
    else if (fileName.endsWith(".pdf")) {
      parser = new PDFParse({ data: file.buffer });
      text = (await parser.getText()).text;
    } else
      return res.status(400).json({
        error:
          "Could not read this file. Please upload a valid PDF, DOCX or TXT resume.",
      });

    const validated = validateResumeInput({
      text,
      fileName: file.originalname,
      size: file.size,
    });
    const u = user(req);
    const career = store.findCareer(req.body?.careerId || u.careerGoalId) ||
      u.customCareer || { name: u.careerGoal || "Career target", skills: [] };
    const result = analyzeResumeText(validated.text, u, career);
    try {
      const ai = await extractResumeWithAI(validated.text, career.name);
      const evidenceIsVerbatim = (item) =>
        typeof item.evidence === "string" &&
        item.evidence.trim() &&
        validated.text
          .toLowerCase()
          .includes(item.evidence.trim().toLowerCase());
      const verified = (items) => items.filter(evidenceIsVerbatim);
      const mergeEvidence = (existing, items, key) => {
        const merged = [...existing];
        for (const item of verified(items)) {
          const identity = String(item[key] || item.evidence).toLowerCase();
          if (
            !merged.some(
              (current) =>
                String(current[key] || current.evidence).toLowerCase() ===
                identity,
            )
          )
            merged.push(item);
        }
        return merged;
      };
      if (
        ai.name &&
        validated.text
          .split(/\r?\n/)
          .some((line) => line.trim() === ai.name.trim())
      )
        result.name = ai.name;
      result.skills = mergeEvidence(
        result.skills,
        ai.skills.map((item) => ({
          ...item,
          confidence: Math.max(0, Math.min(1, Number(item.confidence) || 0)),
        })),
        "name",
      );
      result.projects = mergeEvidence(
        result.projects,
        ai.projects.map((item) => ({
          ...item,
          technologies: (item.technologies || []).filter((technology) =>
            item.evidence
              .toLowerCase()
              .includes(String(technology).toLowerCase()),
          ),
        })),
        "name",
      );
      result.education = mergeEvidence(
        result.education,
        ai.education,
        "evidence",
      );
      result.experience = mergeEvidence(
        result.experience,
        ai.experience,
        "evidence",
      );
      result.certifications = mergeEvidence(
        result.certifications,
        ai.certifications,
        "name",
      );
      result.internships = mergeEvidence(
        result.internships,
        ai.internships,
        "evidence",
      );
      result.achievements = mergeEvidence(
        result.achievements,
        ai.achievements,
        "evidence",
      );
      result.technologies = [
        ...new Set([
          ...result.skills.map((item) => item.name),
          ...result.projects.flatMap((item) => item.technologies),
        ]),
      ];
      const missing = [];
      if (!/summary|objective|profile/i.test(validated.text))
        missing.push("Professional Summary");
      if (!/github\.com|gitlab\.com|portfolio/i.test(validated.text))
        missing.push("GitHub or Portfolio URL");
      if (!/\S+@\S+\.\S+|\+?\d[\d ()-]{7,}\d/.test(validated.text))
        missing.push("Contact Information");
      if (!result.education.length) missing.push("Education");
      if (
        !result.experience.length &&
        !result.internships.length &&
        !result.projects.length
      )
        missing.push("Experience or Projects");
      if (!result.skills.length) missing.push("Skills");
      result.missingSections = missing;
      result.resumeScore = Math.round(((6 - missing.length) / 6) * 100);
      result.missingSkills = (career.skills || [])
        .map((skill) => skill.skillName || skill)
        .filter(
          (skill) =>
            !result.skills.some(
              (item) => item.name.toLowerCase() === String(skill).toLowerCase(),
            ),
        );
      result.recommendations = missing.map(
        (section) =>
          `Add a ${section.toLowerCase()} section if it applies to your experience.`,
      );
      result.analysisSource = "ai-verified-extraction";
    } catch {
      result.analysisNotice =
        "AI analysis is temporarily unavailable. Showing deterministic analysis.";
    }
    const resumeSkillNames = new Set(
      result.skills.map((item) => item.name.toLowerCase()),
    );
    const requiredSkills = (career.skills || []).map((skill) =>
      String(skill.skillName || skill),
    );
    const coveredSkills = requiredSkills.filter((skill) =>
      resumeSkillNames.has(skill.toLowerCase()),
    );
    result.careerImpact = u.careerGoalId
      ? {
          targetCareer: career.name,
          coveredSkills,
          missingSkills: requiredSkills.filter(
            (skill) => !resumeSkillNames.has(skill.toLowerCase()),
          ),
          requiredSkillCount: requiredSkills.length,
        }
      : null;
    result.resumeCareerMatches = rankResumeCareers(
      result.skills,
      catalog.careers,
    );
    result.fileName = validated.fileName;
    result.projectsDetected = result.projects.length;
    u.resumeAnalysis = result;
    u.updatedAt = new Date();
    store.resumeAnalyses.set(u._id, result);
    store.saveStudent(u);
    res.json(result);
  } catch {
    res.status(400).json({
      error:
        "Could not read this file. Please upload a valid PDF, DOCX or TXT resume.",
    });
  } finally {
    if (parser) await parser.destroy().catch(() => {});
  }
});
export default r;
