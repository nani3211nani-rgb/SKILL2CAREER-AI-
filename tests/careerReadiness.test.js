import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCareerReadiness, analyzeProject, analyzeResumeText, createInterviewSession, getInterviewQuestionContext, answerInterviewQuestion, getRecommendedLearning } from '../services/careerReadinessService.js';
import { recommend, rankResumeCareers } from '../services/careerMatch.js';

test('career readiness calculation combines weighted category scores and highlights priorities', () => {
  const result = calculateCareerReadiness({
    skills: [
      { skillName: 'JavaScript', proficiency: 'Advanced' },
      { skillName: 'React', proficiency: 'Intermediate' },
      { skillName: 'Git', proficiency: 'Beginner' }
    ],
    resumeScore: 72,
    projectScore: 68,
    interviewScore: 55,
    certifications: ['AWS Cloud Practitioner'],
    communication: 80
  }, {
    name: 'Software Engineer',
    skills: [
      { skillName: 'JavaScript', requiredLevel: 'Intermediate', weight: 3 },
      { skillName: 'React', requiredLevel: 'Intermediate', weight: 3 },
      { skillName: 'Node.js', requiredLevel: 'Intermediate', weight: 3 },
      { skillName: 'Git', requiredLevel: 'Intermediate', weight: 2 }
    ]
  });

  assert.equal(result.targetCareer, 'Software Engineer');
  assert.ok(result.overallReadiness >= 0 && result.overallReadiness <= 100);
  assert.ok(result.categoryScores.technicalSkills > 0);
  assert.ok(Array.isArray(result.strengths));
  assert.ok(Array.isArray(result.weaknesses));
  assert.ok(Array.isArray(result.priorityActions));
});

test('project analysis reports skill coverage, missing skills, and score', () => {
  const result = analyzeProject({
    name: 'Attendance Dashboard',
    description: 'Built a dashboard for attendance tracking and reporting.',
    technologies: ['React', 'Node.js', 'SQL'],
    contribution: 'Developed front-end and API for attendance records'
  }, 'Software Engineer');

  assert.ok(result.projectScore >= 0 && result.projectScore <= 100);
  assert.ok(Array.isArray(result.skillsDemonstrated));
  assert.ok(Array.isArray(result.missingSkills));
  assert.ok(typeof result.careerRelevance === 'string');
});

test('mock interview session starts and evaluates answers', () => {
  const session = createInterviewSession({ career: 'Software Engineer', difficulty: 'Intermediate', type: 'Technical' });
  assert.equal(session.career, 'Software Engineer');
  assert.ok(Array.isArray(session.questions));
  assert.ok(session.questions.length > 0);

  const answer = answerInterviewQuestion(session.sessionId, {
    answer: 'Use a map to track seen values, then compare counts to confirm duplicates.'
  });

  assert.ok(answer.score >= 0 && answer.score <= 100);
  assert.ok(answer.feedback.includes('technical') || answer.feedback.length > 0);
});

test('learning recommendation falls back gracefully when no API data is available', () => {
  const result = getRecommendedLearning('React', 'Beginner');
  assert.ok(Array.isArray(result.videos));
  assert.ok(result.videos.length >= 0);
  if (result.videos.length > 0) {
    assert.match(result.videos[0].link, /^https?:\/\//);
  }
});

test('readiness leaves categories unscored until evidence is submitted', () => {
  const result = calculateCareerReadiness({
    profileCompleted: true,
    skills: [{ skillName: 'SQL', proficiency: 'Intermediate' }]
  }, {
    name: 'Data Analyst',
    skills: [{ skillName: 'SQL', requiredLevel: 'Intermediate', weight: 1 }]
  });

  assert.equal(result.categoryScores.projects, null);
  assert.equal(result.categoryScores.resume, null);
  assert.equal(result.categoryScores.interview, null);
  assert.equal(result.categoryScores.certifications, null);
  assert.equal(result.categoryScores.technicalSkills, 100);
  assert.equal(result.overallReadiness, 100);
});

test('resume analysis reports only skills and projects supported by extracted text', () => {
  const result = analyzeResumeText(`Maya Singh\nmaya@example.test\nProfessional Summary\nComputer science student.\nEducation\nB.Tech Computer Science\nProjects\nStudent Portal\n- Built a portal using React and SQL.\nTechnical Skills\nReact, SQL` , {}, { name: 'Software Engineer', skills: [] });

  assert.equal(result.name, 'Maya Singh');
  assert.deepEqual(result.skills.map((skill) => skill.name).sort(), ['React', 'SQL']);
  assert.equal(result.projects.length, 1);
  assert.equal(result.projects[0].name, 'Student Portal');
  assert.match(result.projects[0].evidence, /React and SQL/);
  assert.ok(result.resumeScore > 0 && result.resumeScore < 100);
});

test('project score changes when submitted evidence changes', () => {
  const sparse = analyzeProject({ name: 'Student Portal', description: 'A student portal.' }, { name: 'Frontend Developer', skills: [{ skillName: 'React' }] });
  const detailed = analyzeProject({
    name: 'Student Portal',
    description: 'A student portal with React components, tests, and a deployed user dashboard.',
    technologies: ['React', 'JavaScript', 'CSS'],
    githubUrl: 'https://github.com/student/portal'
  }, { name: 'Frontend Developer', skills: [{ skillName: 'React' }] });

  assert.ok(detailed.projectScore > sparse.projectScore);
  assert.deepEqual(detailed.skillsDemonstrated, ['React']);
  assert.deepEqual(sparse.technologies, []);
  assert.ok(detailed.resumeValue.score > sparse.resumeValue.score);
  assert.ok(sparse.missingFeatures.includes('Testing evidence'));
});

test('interview questions follow the selected career and scores use the submitted answer', () => {
  const session = createInterviewSession({ career: 'Data Analyst', difficulty: 'Beginner', type: 'Technical' });
  assert.match(session.questions[0].question, /Data Analyst/);
  assert.match(session.questions[0].question, /Excel/);

  const short = answerInterviewQuestion(session.sessionId, { answer: 'I use Excel.' });
  assert.equal(short.nextQuestion.id, 2);
  assert.equal(short.complete, false);

  const longSession = createInterviewSession({ career: 'Data Analyst', difficulty: 'Beginner', type: 'Technical' });
  const detailed = answerInterviewQuestion(longSession.sessionId, { answer: 'I would use Excel to clean the data. For example, I would validate the pivot results and explain the final trend to the team.' });
  assert.ok(detailed.score > short.score);
  assert.ok(detailed.strengths.length > 0);
});

test('interview result uses an evaluation of the submitted answer and current question', () => {
  const session = createInterviewSession({ career: 'Accountant', difficulty: 'Intermediate', type: 'Technical' });
  const context = getInterviewQuestionContext(session.sessionId);
  assert.equal(context.career, 'Accountant');
  assert.match(context.question, /Accountant/);
  assert.match(context.question, /Accounting/);

  const evaluated = answerInterviewQuestion(session.sessionId, {
    answer: 'I do not know the answer yet, but I would review the account records and check the relevant policy.',
    evaluation: {
      source: 'ai',
      score: 24,
      communicationScore: 72,
      feedback: 'You acknowledged the gap and described a reasonable first step, but did not explain the accounting approach.',
      strengths: ['Identified a next step'],
      weaknesses: ['Explain the relevant accounting rule and how you would apply it.']
    }
  });

  assert.equal(evaluated.score, 24);
  assert.equal(evaluated.evaluationSource, 'ai');
  assert.match(evaluated.feedback, /accounting approach/);
  assert.ok(evaluated.weaknesses[0].includes('accounting rule'));
});

test('career match changes with education and selected skill proficiency', () => {
  const career = { name: 'Data Analyst', interests: [], educationPreferences: ['data'], skills: [{ skillName: 'SQL', requiredLevel: 'Intermediate', weight: 1 }] };
  const dataStudent = { education: { degree: 'B.Sc', branch: 'Data Science' }, skills: [{ skillName: 'SQL', proficiency: 'Advanced' }] };
  const unrelatedStudent = { education: { degree: 'B.A.', branch: 'Fine Arts' }, skills: [{ skillName: 'SQL', proficiency: 'Beginner' }] };

  const dataMatch = recommend(dataStudent, [career])[0].matchScore;
  const unrelatedMatch = recommend(unrelatedStudent, [career])[0].matchScore;
  assert.ok(dataMatch > unrelatedMatch);
});

test('resume career recommendations rank roles by skills extracted from resume text', () => {
  const careers = [
    { name: 'Data Analyst', skills: [{ skillName: 'SQL', weight: 1 }, { skillName: 'Python', weight: 1 }, { skillName: 'Excel', weight: 1 }] },
    { name: 'Web Developer', skills: [{ skillName: 'HTML', weight: 1 }, { skillName: 'CSS', weight: 1 }, { skillName: 'React', weight: 1 }] }
  ];

  const matches = rankResumeCareers([{ name: 'SQL' }, { name: 'Python' }, { name: 'Excel' }], careers);
  assert.equal(matches[0].career, 'Data Analyst');
  assert.equal(matches[0].matchScore, 100);
  assert.deepEqual(matches[0].matchedSkills, ['SQL', 'Python', 'Excel']);
  assert.equal(matches.length, 1);
});

test('readiness excludes project and interview scores earned against a different career', () => {
  const result = calculateCareerReadiness({
    profileCompleted: true,
    skills: [{ skillName: 'SQL', proficiency: 'Advanced' }],
    projectAnalyses: [{ projectScore: 95, targetCareer: 'Data Analyst' }],
    interviewScores: [{ score: 90, targetCareer: 'Data Analyst' }],
    interviewCommunicationScores: [{ score: 88, targetCareer: 'Data Analyst' }]
  }, {
    name: 'Web Developer',
    skills: [{ skillName: 'React', requiredLevel: 'Intermediate', weight: 1 }]
  });

  assert.equal(result.categoryScores.projects, null);
  assert.equal(result.categoryScores.interview, null);
  assert.equal(result.categoryScores.communication, null);
});
