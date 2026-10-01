import { analyzeSkillGap } from "./skillGap.js";
import { env } from "../config/env.js";
import { catalog } from "./store.js";

const interviewSessions = new Map();
const defaultCareerSkills = {
  "Software Engineer": [
    "JavaScript",
    "React",
    "Node.js",
    "Git",
    "SQL",
    "APIs",
    "Testing",
  ],
  Accountant: [
    "Accounting",
    "Excel",
    "Financial Analysis",
    "Communication",
    "Critical Thinking",
  ],
  "Data Analyst": ["Excel", "SQL", "Python", "Power BI", "Statistics"],
  "Frontend Developer": ["HTML", "CSS", "JavaScript", "React", "Git"],
  "Product Manager": [
    "Communication",
    "Research",
    "Project Management",
    "Presentation",
    "Requirements Gathering",
  ],
  "Cybersecurity Analyst": [
    "Cybersecurity",
    "Networking",
    "Linux",
    "Python",
    "Problem Solving",
  ],
  "Data Scientist": [
    "Python",
    "SQL",
    "Statistics",
    "Machine Learning",
    "Data Visualization",
  ],
};

const commonSkillKeywords = new Map([
  ["JavaScript", ["javascript", "ecmascript", "js"]],
  ["React", ["react", "react.js"]],
  ["Node.js", ["node.js", "nodejs"]],
  ["SQL", ["sql"]],
  ["Git", ["git", "github"]],
  ["Testing", ["testing", "unit testing", "integration testing", "jest"]],
  ["Python", ["python"]],
  ["Excel", ["excel", "microsoft excel"]],
  ["Power BI", ["power bi", "powerbi"]],
  ["Communication", ["communication skills"]],
  ["Problem Solving", ["problem solving"]],
  ["APIs", ["api", "apis", "rest api", "rest apis"]],
]);
for (const skill of catalog.skills) {
  if (!commonSkillKeywords.has(skill.name))
    commonSkillKeywords.set(skill.name, [skill.name.toLowerCase()]);
}

function clamp(value, min, max) {
  return Math.min(Math.max(Number(value) || 0, min), max);
}

function firstWords(text, limit = 3) {
  return String(text || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, limit)
    .join(" ");
}

export function calculateCareerReadiness(student = {}, career = {}) {
  const careerSkills = Array.isArray(career.skills)
    ? career.skills
    : defaultCareerSkills[career.name] || [];
  const gap = analyzeSkillGap(student.skills || [], careerSkills);
  const technicalSkills = clamp(gap.matchScore || 0, 0, 100);
  const careerProjects = (student.projectAnalyses || []).filter(
    (item) => item.targetCareer === career.name,
  );
  const projects = careerProjects.length
    ? Math.round(
        careerProjects.reduce((sum, item) => sum + item.projectScore, 0) /
          careerProjects.length,
      )
    : null;
  const resume = student.resumeAnalysis?.resumeScore ?? null;
  const certificationCount =
    student.resumeAnalysis?.certifications?.length ||
    student.certifications?.length ||
    0;
  const certifications = certificationCount
    ? clamp(certificationCount * 20, 0, 100)
    : null;
  const careerInterviews = (student.interviewScores || []).filter(
    (item) => typeof item === "number" || item.targetCareer === career.name,
  );
  const interviewScores = careerInterviews.map((item) =>
    typeof item === "number" ? item : item.score,
  );
  const interview = interviewScores.length
    ? Math.round(
        interviewScores.reduce((sum, score) => sum + score, 0) /
          interviewScores.length,
      )
    : null;
  const communicationScores = (student.interviewCommunicationScores || [])
    .filter(
      (item) => typeof item === "number" || item.targetCareer === career.name,
    )
    .map((item) => (typeof item === "number" ? item : item.score));
  const communication = communicationScores.length
    ? Math.round(
        communicationScores.reduce((sum, score) => sum + score, 0) /
          communicationScores.length,
      )
    : null;

  const categoryScores = {
    technicalSkills,
    projects,
    resume,
    certifications,
    interview,
    communication,
  };

  const weights = {
    technicalSkills: 0.32,
    projects: 0.18,
    resume: 0.16,
    certifications: 0.1,
    interview: 0.12,
    communication: 0.12,
  };
  const available = Object.entries(categoryScores).filter(([, score]) =>
    Number.isFinite(score),
  );
  const totalWeight = available.reduce((sum, [key]) => sum + weights[key], 0);
  const overallReadiness = totalWeight
    ? Math.round(
        available.reduce((sum, [key, score]) => sum + score * weights[key], 0) /
          totalWeight,
      )
    : null;

  const strengths = [];
  if (gap.strengths?.length) {
    gap.strengths
      .slice(0, 4)
      .forEach((skill) => strengths.push(skill.skillName));
  }

  const weaknesses = [];
  if (technicalSkills < 70)
    weaknesses.push("Technical skill readiness is below the target level.");
  if (projects !== null && projects < 65)
    weaknesses.push(
      "Projects need more demonstrated impact in the target stack.",
    );
  if (resume !== null && resume < 65)
    weaknesses.push(
      "Resume evidence should highlight relevant projects and measurable outcomes.",
    );
  if (interview !== null && interview < 60)
    weaknesses.push(
      "Interview performance needs more structured practice and clearer examples.",
    );

  const missingSkills = [...gap.missingSkills, ...gap.partialGaps]
    .slice(0, 4)
    .map((skill) => skill.skillName || skill.name || "Skill");
  const priorityActions = [];
  if (missingSkills.length)
    priorityActions.push(
      `Learn ${missingSkills[0]} and build a short project around it.`,
    );
  if (projects === null)
    priorityActions.push("Analyze a project you have actually built.");
  else if (projects < 80)
    priorityActions.push(
      "Improve the analyzed project with role-relevant features and measurable outcomes.",
    );
  if (resume === null)
    priorityActions.push(
      "Analyze your resume to measure its evidence for this career.",
    );
  else if (resume < 70)
    priorityActions.push(
      "Improve the missing sections identified in your resume analysis.",
    );
  if (interview === null)
    priorityActions.push(
      "Complete a mock interview to add interview evidence to your readiness.",
    );
  else if (interview < 70)
    priorityActions.push(
      "Practice another interview and use the feedback from your previous answers.",
    );

  return {
    targetCareer: career.name || "Career target",
    overallReadiness,
    categoryScores,
    strengths,
    weaknesses,
    priorityActions: priorityActions.slice(0, 5),
    missingSkills,
    skillGap: gap,
  };
}

export function analyzeProject(
  project = {},
  targetCareer = "Software Engineer",
) {
  const careerName =
    typeof targetCareer === "string"
      ? targetCareer
      : targetCareer.name || "Career target";
  const careerSkills = Array.isArray(targetCareer?.skills)
    ? targetCareer.skills.map((skill) => skill.skillName || skill)
    : defaultCareerSkills[careerName] || [];
  const technologies = Array.isArray(project.technologies)
    ? project.technologies.map((tech) => String(tech).trim()).filter(Boolean)
    : [];
  const description =
    `${project.description || ""} ${project.contribution || ""}`.toLowerCase();
  const targetSkills = careerSkills;
  const matchedSkills = technologies.filter((tech) => {
    const normalized = tech.toLowerCase();
    return targetSkills.some(
      (skill) =>
        skill.toLowerCase() === normalized ||
        normalized.includes(skill.toLowerCase()),
    );
  });

  const missingSkills = targetSkills
    .filter((skill) => {
      const normalized = skill.toLowerCase();
      return !technologies.some(
        (tech) =>
          tech.toLowerCase() === normalized ||
          tech.toLowerCase().includes(normalized),
      );
    })
    .slice(0, 4);

  const evidenceSignals = [
    project.name,
    project.description,
    project.contribution,
    project.githubUrl,
  ].filter((value) => String(value || "").trim()).length;
  const descriptionWords = String(project.description || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const projectScore = clamp(
    Math.round(
      (technologies.length ? 20 + Math.min(technologies.length, 5) * 8 : 0) +
        Math.min(descriptionWords, 80) * 0.35 +
        (String(project.contribution || "").trim() ? 10 : 0) +
        (/https?:\/\//i.test(String(project.githubUrl || "")) ? 10 : 0) +
        (description.includes("test") ? 8 : 0) +
        (description.includes("deploy") ? 8 : 0),
    ),
    0,
    100,
  );

  const strengths = technologies.slice(0, 4);
  const suggestions = [];
  const missingFeatures = [];
  if (!description.includes("test")) missingFeatures.push("Testing evidence");
  if (!description.includes("deploy") && !description.includes("live"))
    missingFeatures.push("Deployment evidence");
  if (!description.includes("error handling"))
    missingFeatures.push("Error handling");
  if (!project.githubUrl) missingFeatures.push("Source repository link");
  suggestions.push(
    ...missingFeatures.map(
      (feature) =>
        `Add ${feature.toLowerCase()} if it applies to your project.`,
    ),
  );

  return {
    projectName: project.name || "",
    projectScore,
    skillsDemonstrated: matchedSkills.length
      ? matchedSkills
      : technologies.slice(0, 3),
    technologies,
    technicalDepth: technologies.length + Math.min(descriptionWords, 100) / 10,
    problemSolved: String(project.description || ""),
    complexity:
      descriptionWords > 80 && technologies.length > 2
        ? "Substantial evidence in supplied description"
        : "Limited evidence in supplied description",
    realWorldRelevance:
      /user|customer|business|real.?world|production|community/i.test(
        description,
      ),
    missingFeatures,
    resumeValue: {
      score: clamp(
        Math.round(projectScore * (project.githubUrl ? 1 : 0.85)),
        0,
        100,
      ),
      evidence: [
        project.name,
        technologies.length ? technologies.join(", ") : "",
        project.githubUrl || "",
      ].filter(Boolean),
    },
    evidenceSignals,
    missingSkills,
    technicalStrengths: strengths,
    improvementSuggestions: suggestions.length
      ? suggestions
      : ["Keep documenting the project impact and user outcomes."],
    careerRelevance: matchedSkills.length
      ? `${project.name || "This project"} demonstrates target-role technologies: ${matchedSkills.join(", ")}.`
      : `No target-career technologies were matched in the submitted technologies: ${careerName}.`,
    contributionToReadiness: projectScore,
  };
}

export function validateResumeInput({ text, fileName, size }) {
  const cleanedText = String(text || "")
    .replace(/\0/g, "")
    .trim();
  if (!cleanedText) throw new Error("Resume text is required.");
  if (cleanedText.length < 20)
    throw new Error("Resume content is too short to analyze.");
  if (cleanedText.length > 50000)
    throw new Error("Resume is too large for analysis.");
  if (size && Number(size) > 5 * 1024 * 1024)
    throw new Error("Resume exceeds the size limit.");
  const safeName = String(fileName || "resume.txt").replace(/[\\/]+/g, "");
  if (!safeName || /[<>:"|?*]/.test(safeName))
    throw new Error("Unsupported or unsafe resume file name.");
  return { text: cleanedText.slice(0, 50000), fileName: safeName };
}

export function analyzeResumeText(text = "", student = {}, career = {}) {
  const source = String(text || "").trim();
  const lines = source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const uniqueSkills = new Map();
  for (const [name, aliases] of commonSkillKeywords) {
    const needles = [name, ...aliases].sort((a, b) => b.length - a.length);
    const match = needles.find((needle) =>
      new RegExp(
        `(^|[^a-z0-9+#.])${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9+#.]|$)`,
        "i",
      ).test(source),
    );
    if (match) {
      const evidence =
        lines.find((line) =>
          line.toLowerCase().includes(match.toLowerCase()),
        ) || match;
      uniqueSkills.set(name, { name, confidence: 0.9, evidence });
    }
  }
  const sectionHeading =
    /^(professional\s+summary|summary|objective|education|experience|work experience|internships?|skills|technical skills|certifications?|achievements?|projects?|portfolio)\s*:?\s*$/i;
  const sectionLines = (pattern) =>
    lines.filter((line) => pattern.test(line) && !sectionHeading.test(line));
  const education = sectionLines(
    /\b(b\.? ?tech|b\.? ?sc|bachelor|mba|master|diploma|degree|university|college)\b/i,
  ).map((evidence) => ({ evidence }));
  const experience = sectionLines(
    /\b(intern|experience|employment|worked at|work history|years? of experience)\b/i,
  ).map((evidence) => ({ evidence }));
  const certifications = sectionLines(
    /\b(certification|certified|certificate|license|licence)\b/i,
  ).map((evidence) => ({ name: evidence, evidence }));
  const internships = sectionLines(/\b(intern|internship)\b/i).map(
    (evidence) => ({ evidence }),
  );
  const achievements = sectionLines(
    /\b(achievement|award|honou?r|scholarship|published|winner|ranked|increased|reduced|improved by)\b/i,
  ).map((evidence) => ({ evidence }));
  const projectStart = lines.findIndex((line) =>
    /^(projects?|portfolio)\s*:?\s*$/i.test(line),
  );
  const inlineProject = lines.find((line) =>
    /^(projects?|portfolio)\s*:\s*.+/i.test(line),
  );
  const projectEnd =
    projectStart < 0
      ? -1
      : lines.findIndex(
          (line, index) => index > projectStart && sectionHeading.test(line),
        );
  const projectLines = inlineProject
    ? [inlineProject.replace(/^(projects?|portfolio)\s*:\s*/i, "")]
    : projectStart >= 0
      ? lines
          .slice(projectStart + 1, projectEnd < 0 ? undefined : projectEnd)
          .filter((line) => line && !sectionHeading.test(line))
      : [];
  const projectGroups = [];
  for (const line of projectLines) {
    const isBullet = /^[-*•\d.]+\s/.test(line);
    if (!isBullet || !projectGroups.length)
      projectGroups.push({
        name: line.replace(/^[-*•\d.\s]+/, ""),
        lines: [line],
      });
    else projectGroups.at(-1).lines.push(line);
  }
  const projects = projectGroups.map(
    ({ name: projectName, lines: evidenceLines }) => {
      const evidence = evidenceLines.join(" ");
      return {
        name: projectName,
        technologies: [...uniqueSkills.keys()].filter((skill) =>
          evidence.toLowerCase().includes(skill.toLowerCase()),
        ),
        evidence,
      };
    },
  );
  const name =
    lines.find(
      (line) =>
        /^[A-Z][A-Za-z'-]+(?:\s+[A-Z][A-Za-z'-]+){1,3}$/.test(line) &&
        !/resume|curriculum vitae/i.test(line),
    ) || null;
  const missingSections = [];
  if (!/summary|objective|profile/i.test(source))
    missingSections.push("Professional Summary");
  if (!/github\.com|gitlab\.com|portfolio/i.test(source))
    missingSections.push("GitHub or Portfolio URL");
  if (!/\b(email|@)\b|\S+@\S+\.\S+/.test(source))
    missingSections.push("Contact Information");
  if (!education.length) missingSections.push("Education");
  if (!experience.length && !projects.length)
    missingSections.push("Experience or Projects");
  if (!uniqueSkills.size) missingSections.push("Skills");
  const sectionsPresent = 6 - missingSections.length;
  const resumeScore = Math.round((sectionsPresent / 6) * 100);
  const careerSkills = Array.isArray(career.skills)
    ? career.skills.map((skill) => String(skill.skillName || skill).trim())
    : [];
  const missingSkills = careerSkills.filter(
    (skill) => !uniqueSkills.has(skill),
  );
  const recommendations = missingSections.map(
    (section) =>
      `Add a ${section.toLowerCase()} section if it applies to your experience.`,
  );
  if (missingSkills.length)
    recommendations.push(
      `Add evidence for target-career skills only where you have used them: ${missingSkills.join(", ")}.`,
    );

  return {
    name,
    resumeScore,
    skills: [...uniqueSkills.values()],
    projects,
    education,
    certifications,
    experience,
    internships,
    technologies: [...uniqueSkills.keys()],
    achievements,
    missingSections,
    missingSkills,
    recommendations,
    analysisSource: "deterministic",
  };
}

export function getRecommendedLearning(skill = "", level = "Beginner") {
  const safeSkill = String(skill || "").trim();
  const normalizedLevel = String(level || "Beginner").trim() || "Beginner";
  return {
    skill: safeSkill,
    level: normalizedLevel,
    videos: [],
    message: safeSkill
      ? "Learning video search is currently unavailable. Please check your YouTube API configuration."
      : "Choose a skill from your assessment gaps to search for learning videos.",
  };
}

export async function searchYoutubeVideos(
  skill = "",
  level = "Beginner",
  career = "",
) {
  const key = (env.youtubeApiKey || "").trim();
  const safeSkill = String(skill || "").trim();
  const normalizedLevel = String(level || "Beginner").trim() || "Beginner";
  if (!safeSkill)
    return {
      skill: "",
      level: normalizedLevel,
      videos: [],
      message:
        "Choose a skill from your assessment gaps to search for learning videos.",
    };
  const query = `${safeSkill} ${career ? `${career} ` : ""}${normalizedLevel} tutorial`;
  if (!key) {
    return {
      skill: safeSkill,
      level: normalizedLevel,
      videos: [],
      message: "Learning video search is currently unavailable.",
    };
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(query)}&safeSearch=moderate&key=${encodeURIComponent(key)}`;
    const response = await fetch(url);
    if (!response.ok) {
      return {
        skill: safeSkill,
        level: normalizedLevel,
        videos: [],
        message: "Learning video search is currently unavailable.",
      };
    }

    const data = await response.json();
    const videos = (data.items || [])
      .map((item) => {
        const videoId = item.id?.videoId;
        const title = item.snippet?.title;
        const channel = item.snippet?.channelTitle;
        if (!videoId || !title || !channel) return null;
        return {
          title,
          channel,
          thumbnail: item.snippet?.thumbnails?.medium?.url || "",
          videoId,
          skill: safeSkill,
          level: normalizedLevel,
          url: `https://www.youtube.com/watch?v=${videoId}`,
        };
      })
      .filter(Boolean);

    return {
      skill: safeSkill,
      level: normalizedLevel,
      videos,
      message: videos.length
        ? "Relevant learning videos were found."
        : "No relevant videos were returned for this skill.",
    };
  } catch {
    return {
      skill: safeSkill,
      level: normalizedLevel,
      videos: [],
      message: "Learning video search is currently unavailable.",
    };
  }
}

export function getInterviewQuestions({
  career = "",
  difficulty = "Intermediate",
  type = "Technical",
} = {}) {
  if (!String(career).trim())
    throw new Error("Choose a career before starting an interview.");
  const careerArticle = /^[aeiou]/i.test(career) ? "an" : "a";
  const skills = defaultCareerSkills[career] || [career];
  const focus = skills[0] || career;
  const secondFocus = skills[1] || focus;
  const questions =
    type === "HR"
      ? [
          `Describe a specific challenge you have handled that demonstrates readiness for ${career}.`,
          `How do you respond to feedback when working toward a ${career} goal?`,
          `Describe how you would explain a difficult ${career}-related decision to a teammate.`,
        ]
      : [
          `For ${careerArticle} ${career} role, explain how you would solve a practical problem involving ${focus}.`,
          `At ${difficulty.toLowerCase()} level, what trade-offs would you consider when using ${secondFocus} in ${careerArticle} ${career} role?`,
          `How would you test and communicate the result of a ${career} task involving ${focus}?`,
        ];

  return questions.map((question, index) => ({
    id: index + 1,
    question,
    topic:
      type === "HR"
        ? "Communication and experience"
        : index === 0
          ? focus
          : secondFocus,
  }));
}

export function createInterviewSession({
  career = "",
  difficulty = "Intermediate",
  type = "Mixed",
} = {}) {
  const questions = getInterviewQuestions({ career, difficulty, type });

  const session = {
    sessionId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    career,
    difficulty,
    type,
    questions,
    startedAt: new Date().toISOString(),
    answers: [],
    currentQuestion: 0,
  };

  interviewSessions.set(session.sessionId, session);
  return session;
}

export function getInterviewQuestionContext(sessionId) {
  const session = interviewSessions.get(sessionId);
  if (!session) throw new Error("Interview session not found.");
  const question = session.questions[session.currentQuestion];
  if (!question) throw new Error("This interview has no unanswered questions.");
  return {
    career: session.career,
    difficulty: session.difficulty,
    question: question.question,
    topic: question.topic,
  };
}

export function answerInterviewQuestion(
  sessionId,
  { answer = "", evaluation = null } = {},
) {
  const session = interviewSessions.get(sessionId);
  if (!session) {
    throw new Error("Interview session not found.");
  }

  const response = String(answer || "").trim();
  if (!response || response.length < 10) {
    throw new Error("Please provide a meaningful answer before submitting.");
  }

  const question = session.questions[session.currentQuestion];
  if (!question) throw new Error("This interview has no unanswered questions.");
  const topic = question.topic.toLowerCase();
  const topicMentioned = response.toLowerCase().includes(topic);
  const hasExample =
    /for example|such as|I built|I used|I would|first|then|because/i.test(
      response,
    );
  const hasStructure =
    response.split(/[.!?;]/).filter((part) => part.trim()).length >= 2;
  const score = clamp(
    Math.round(
      Math.min(response.length, 420) / 5 +
        (topicMentioned ? 15 : 0) +
        (hasExample ? 15 : 0) +
        (hasStructure ? 10 : 0),
    ),
    0,
    100,
  );
  const feedback = `Your answer contained ${response.trim().split(/\s+/).length} words${topicMentioned ? ` and directly addressed ${question.topic}` : `; add a direct explanation of ${question.topic}`}${hasExample ? " with a practical example" : " with a concrete example"}.`;
  const communicationScore = clamp(
    Math.round(
      Math.min(response.length, 300) / 4 +
        (hasStructure ? 20 : 0) +
        (hasExample ? 10 : 0),
    ),
    0,
    100,
  );

  const result = {
    sessionId,
    score: evaluation?.score ?? Math.round(score),
    feedback: evaluation?.feedback || feedback,
    strengths: evaluation?.strengths || [
      ...(topicMentioned ? [`Addressed ${question.topic}`] : []),
      ...(hasExample ? ["Included a practical example"] : []),
      ...(hasStructure ? ["Used multiple explanatory steps"] : []),
    ],
    weaknesses: evaluation?.weaknesses || [
      ...(!topicMentioned
        ? [`Connect the answer directly to ${question.topic}.`]
        : []),
      ...(!hasExample
        ? ["Add an example grounded in your own work or approach."]
        : []),
      ...(!hasStructure ? ["Organize the answer into clear steps."] : []),
    ],
    communicationScore: evaluation?.communicationScore ?? communicationScore,
    evaluationSource: evaluation?.source || "deterministic",
  };

  session.answers.push({ answer: response, ...result });
  session.currentQuestion += 1;
  let nextQuestion = session.questions[session.currentQuestion] || null;
  if (nextQuestion && score < 50) {
    nextQuestion = {
      ...nextQuestion,
      question: `Follow-up: explain your approach step by step, including how you would use ${nextQuestion.topic}.`,
    };
  } else if (nextQuestion && score >= 80) {
    nextQuestion = {
      ...nextQuestion,
      question: `Deeper follow-up: discuss a trade-off or failure case when applying ${nextQuestion.topic}.`,
    };
  }
  return {
    ...result,
    nextQuestion,
    complete: !nextQuestion,
    averageScore: getInterviewResults(sessionId).averageScore,
  };
}

export function getInterviewResults(sessionId) {
  const session = interviewSessions.get(sessionId);
  if (!session) return { error: "Interview session not found." };

  const average = session.answers.length
    ? Math.round(
        session.answers.reduce((sum, item) => sum + (item.score || 0), 0) /
          session.answers.length,
      )
    : 0;

  return {
    sessionId,
    career: session.career,
    difficulty: session.difficulty,
    type: session.type,
    averageScore: average,
    answerCount: session.answers.length,
    communicationScore: session.answers.length
      ? Math.round(
          session.answers.reduce(
            (sum, item) => sum + item.communicationScore,
            0,
          ) / session.answers.length,
        )
      : null,
    strengths: session.answers.flatMap((answer) => answer.strengths),
    weaknesses: session.answers.flatMap((answer) => answer.weaknesses),
    readinessScore: average,
  };
}

export function buildActionPlan(student = {}, career = {}) {
  const readiness = calculateCareerReadiness(student, career);
  const gapSkills = readiness.missingSkills || [];
  const actions = [
    `Complete ${gapSkills[0] || "your main skill gap"} with a focused learning sprint.`,
    "Build one project aligned to your target role and reflect on the outcome.",
    "Improve your resume by adding your strongest project evidence and measurable outcomes.",
    "Practice one mock interview and review your responses using a structured answer format.",
    "Reassess readiness after each milestone to track progress toward job readiness.",
  ];

  return {
    targetCareer: career?.name || "Career target",
    nextFiveActions: actions,
    readiness,
  };
}

export function buildCareerJourney() {
  return {
    stages: [
      "Current profile",
      "Career target",
      "Skill gap",
      "Learning",
      "Practice",
      "Project",
      "Resume",
      "Mock interview",
      "Job ready",
    ],
  };
}

export function createLearningResource(skill, level = "Beginner") {
  const safeSkill = String(skill || "").trim();
  if (!safeSkill)
    return {
      skill: "",
      level: String(level || "Beginner").trim(),
      steps: [],
      message: "Choose a skill from your assessment gaps.",
    };
  return {
    skill: safeSkill,
    level: String(level || "Beginner").trim(),
    steps: [
      {
        title: "Foundations",
        description: `Start with the fundamentals of ${skill || "the skill"} and build confidence in the basics.`,
      },
      {
        title: "Practice",
        description:
          "Apply the concept in a small hands-on exercise or mini-project.",
      },
      {
        title: "Project",
        description:
          "Turn the skill into a portfolio-ready result with a measurable outcome.",
      },
    ],
  };
}

export function parseResumeFile(file) {
  if (!file || typeof file !== "object")
    return { text: "", fileName: "resume.txt" };
  const text = typeof file.text === "string" ? file.text : "";
  return { text, fileName: file.name || "resume.txt" };
}
