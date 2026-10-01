const app = document.querySelector("#app");
const navItems = [
  ["Home", "bi-grid-1x2-fill", "#/"],
  ["Career Assessment", "bi-compass-fill", "#/assessment"],
  ["Resume Analyzer", "bi-file-earmark-text-fill", "#/resume-analysis"],
  ["Mock Interview", "bi-chat-square-quote-fill", "#/mock-interview"],
];

const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const api = async (url, options = {}) => {
  const headers = {
    ...(options.body instanceof FormData
      ? {}
      : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };
  const response = await fetch(url, { ...options, headers });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text || "The server returned an unreadable response." };
  }
  if (!response.ok)
    throw new Error(data.error || `Request failed (${response.status}).`);
  return data;
};
const renderSiteAttribution = () => {
  if (document.querySelector(".site-attribution")) return;
  const footer = document.createElement("footer");
  footer.className = "site-attribution";
  footer.setAttribute("aria-label", "Development credit");
  footer.innerHTML =
    '<span class="site-attribution-label">Developed by</span><div class="site-attribution-names"><span tabindex="0">Poorna Chander</span><span tabindex="0">Srinidhi</span><span tabindex="0">Shiwani</span></div><span class="site-attribution-school">B.Com (CA) 3rd Year · VJIAS</span>';
  app.append(footer);
};
const enhanceLandingFeatures = () => {
  const cta = app.querySelector(".landing-cta-row");
  if (!cta || app.querySelector(".landing-feature-pills")) return;
  const features = document.createElement("div");
  features.className = "landing-feature-pills";
  features.setAttribute("aria-label", "What you can do");
  features.innerHTML =
    '<span><i class="bi bi-compass-fill" aria-hidden="true"></i> Career match</span><span><i class="bi bi-bar-chart-fill" aria-hidden="true"></i> Skill gaps</span><span><i class="bi bi-youtube" aria-hidden="true"></i> Learn with videos</span><span><i class="bi bi-file-earmark-person-fill" aria-hidden="true"></i> Resume insights</span><span><i class="bi bi-mic-fill" aria-hidden="true"></i> Mock interview</span>';
  cta.before(features);
};
const renderShell = (content, matchScore = null) => {
  const currentPath = location.hash.replace(/^#/, "") || "/";
  const activePath =
    currentPath === "/onboarding" ? "/assessment" : currentPath;
  const nav = navItems
    .map(
      ([label, icon, href]) =>
        `<a class="nav-item${activePath === href.slice(1) || (href === "#/" && activePath === "/") ? " active" : ""}" href="${href}"><i class="bi ${icon} nav-icon" aria-hidden="true"></i><span>${label}</span></a>`,
    )
    .join("");
  app.innerHTML = `<div class="app-shell"><aside class="sidebar"><a class="brand-block sidebar-wordmark" href="#/"><div><div class="brand-name"><span>Skill2Career</span> AI</div><div class="brand-subtitle">YOUR CAREER, CLEARLY.</div></div></a><div class="workspace-label">WORKSPACE</div><nav class="side-nav">${nav}</nav><div class="readiness-mini"><div class="mini-label"><i class="bi bi-activity" aria-hidden="true"></i> CAREER PULSE</div><div class="journey-side-row"><span>Career Target</span><strong class="journey-sidebar-target">Not selected</strong></div><div class="journey-side-row"><span>Readiness</span><strong class="journey-sidebar-readiness">Not assessed</strong></div></div><div class="sidebar-footer">Built for your next move</div></aside><main class="content-panel"><div class="topbar"><div><span class="topbar-kicker">SKILL2CAREER AI</span><span class="topbar-divider"></span><span class="topbar-status"><i class="bi bi-circle-fill" aria-hidden="true"></i> Your growth workspace</span></div><a class="topbar-help" href="#/assessment"><i class="bi bi-lightning-charge-fill" aria-hidden="true"></i> Update profile</a></div>${content}</main></div>`;
  renderSiteAttribution();
  if (activePath === "/assessment") {
    const topbarHelp = app.querySelector(".topbar-help");
    if (topbarHelp) {
      topbarHelp.href = "#/";
      topbarHelp.innerHTML =
        '<i class="bi bi-arrow-left" aria-hidden="true"></i> Back to home';
    }
  }
  Promise.all([
    getProfile(),
    getReadiness(),
    api("/api/career-recommendations"),
  ])
    .then(([profile, readiness, matches]) => {
      const target = app.querySelector(".journey-sidebar-target");
      const score = app.querySelector(".journey-sidebar-readiness");
      const targetMatch = matches.targetMatch?.matchScore;
      if (target) target.textContent = profile.careerGoal || "Not selected";
      if (score)
        score.textContent =
          readiness.ready && Number.isFinite(readiness.overallReadiness)
            ? `${readiness.overallReadiness}%`
            : "Not assessed";
    })
    .catch(() => {
      const score = app.querySelector(".journey-sidebar-readiness");
      if (score) score.textContent = "Unavailable";
    });
};
const progress = (value, kind = "brand") =>
  `<div class="progress-track"><div class="progress-fill ${kind}" style="width:${Math.max(0, Math.min(100, Number(value) || 0))}%"></div></div>`;
const title = (eyebrow, heading, description = "") =>
  `<div class="section-header"><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(heading)}</h1>${description ? `<p>${esc(description)}</p>` : ""}</div>`;
const empty = (message, link = "#/assessment", label = "Complete assessment") =>
  `<div class="empty-state">${esc(message)} <a href="${link}">${esc(label)}</a></div>`;
const errorBox = (message) =>
  `<div class="empty-state error-state" role="alert">${esc(message)}</div>`;
const cleanRenderedUi = (root = app) => {
  root.querySelectorAll(".journey-section").forEach((section) => {
    const heading = section.querySelector("h2")?.textContent.trim() || "";
    if (
      /^(Resume Status|Mock Interview Status|Final Readiness)$/i.test(
        heading,
      ) ||
      section.querySelector("#journey-project-form") ||
      /project/i.test(heading)
    )
      section.remove();
  });
  root.querySelectorAll(".metric-card").forEach((card) => {
    if (
      /^Projects(?: Found)?\b/i.test(
        card.querySelector(".metric-header")?.textContent || "",
      )
    )
      card.remove();
  });
  root.querySelectorAll(".action-list li, .timeline-item").forEach((item) => {
    if (/\bprojects?\b/i.test(item.textContent || "")) item.remove();
  });
  root.querySelectorAll("p").forEach((paragraph) => {
    if (/\bprojects?\b/i.test(paragraph.textContent || "")) paragraph.remove();
  });
};
const getProfile = () =>
  api("/api/student/profile").then((result) => result.student);
const getReadiness = () => api("/api/career-readiness");
const getCareers = () =>
  api("/api/careers").then((result) => result.careers || []);
const list = (items, renderItem, none) =>
  Array.isArray(items) && items.length
    ? items.map(renderItem).join("")
    : `<li>${esc(none)}</li>`;
const detailItems = (items) =>
  Array.isArray(items) ? items.filter(Boolean) : [];
const printList = (items, emptyMessage = "No details recorded yet.") => {
  const values = detailItems(items);
  return values.length
    ? `<ul>${values.map((item) => `<li>${esc(typeof item === "string" ? item : item.title || item.name || item.description || item.url || "")}</li>`).join("")}</ul>`
    : `<p class="print-muted">${esc(emptyMessage)}</p>`;
};
const openRoadmapPrintView = ({
  profile,
  readiness,
  roadmap,
  roadmapSteps,
  visibleActions,
}) => {
  const printWindow = window.open("", "_blank", "width=1100,height=800");
  if (!printWindow) {
    window.alert("Please allow pop-ups to download your roadmap PDF.");
    return;
  }
  const targetCareer =
    readiness.targetCareer || profile.careerGoal || "Career target";
  const matchScore = readiness.skillGap?.matchScore ?? roadmap?.matchScore ?? 0;
  const requiredSkills = detailItems(readiness.skillGap?.requiredSkills).map(
    (item) => `${item.skillName} · ${item.requiredLevel}`,
  );
  const profileSkills = detailItems(profile.skills).map(
    (item) => `${item.skillName} · ${item.proficiency}`,
  );
  const stepMarkup = roadmapSteps
    .map((step, index) => {
      const resources = detailItems(step.resources);
      const resourceMarkup = resources.length
        ? `<ul>${resources
            .map((resource) => {
              const label =
                typeof resource === "string"
                  ? resource
                  : resource.title ||
                    resource.name ||
                    resource.url ||
                    "Learning resource";
              return resource.url
                ? `<li><a href="${esc(resource.url)}">${esc(label)}</a></li>`
                : `<li>${esc(label)}</li>`;
            })
            .join("")}</ul>`
        : '<p class="print-muted">Use the suggested search and practice tasks for this phase.</p>';
      return `<article class="print-step" id="phase-${index + 1}"><div class="print-step-number">${index + 1}</div><div><div class="print-step-kicker">PHASE ${index + 1} · ${esc(step.skill || "Career development")}</div><h2>${esc(step.title || `Career development phase ${index + 1}`)}</h2><p>${esc(step.description || "Build evidence and confidence for this phase of your career journey.")}</p><div class="print-detail-grid"><section><h3>Tasks</h3>${printList(step.tasks, "Practice and document progress for this phase.")}</section><section><h3>Projects and evidence</h3>${printList(step.projects, "Add a project or work sample when ready.")}</section><section><h3>Resources</h3>${resourceMarkup}</section></div></div></article>`;
    })
    .join("");
  const profileSummary =
    [profile.education?.degree, profile.education?.branch]
      .filter(Boolean)
      .join(" · ") || "Education not recorded";
  const generatedDate = new Intl.DateTimeFormat(undefined, {
    dateStyle: "long",
  }).format(new Date());
  printWindow.document.write(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(targetCareer)} roadmap | Skill2Career AI</title><style>@page{size:A4;margin:16mm 15mm}*{box-sizing:border-box}body{margin:0;color:#17263b;background:#fff;font-family:Arial,Helvetica,sans-serif;font-size:10.5pt;line-height:1.55}a{color:#0b62c4;text-decoration:none}.report{max-width:820px;margin:auto}.cover{padding:12mm 0 10mm;border-bottom:3px solid #0f9f8b}.brand{color:#0f9f8b;font-size:12pt;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.cover h1{max-width:670px;margin:22mm 0 4mm;color:#102f4a;font-family:Georgia,serif;font-size:34pt;line-height:1.05;letter-spacing:-.03em}.cover p{max-width:610px;color:#617186;font-size:12pt}.cover-meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:12mm}.pill{padding:6px 10px;border:1px solid #cfe0e8;border-radius:99px;background:#f2faf8;color:#176f69;font-size:9pt;font-weight:700}.report-nav{display:flex;flex-wrap:wrap;gap:14px;margin:8mm 0 10mm;padding:10px 0;border-bottom:1px solid #dfe8ed;font-size:9pt;font-weight:700}.section{break-inside:avoid;margin:10mm 0}.section-title{margin:0 0 5mm;color:#102f4a;font-family:Georgia,serif;font-size:20pt}.summary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.summary-card{padding:12px;border:1px solid #dbe7eb;border-radius:10px;background:#f7fbfc}.summary-card strong{display:block;color:#0f7c70;font-size:22pt;line-height:1}.summary-card span{display:block;margin-top:5px;color:#64758a;font-size:8.5pt;font-weight:700}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.info-card{padding:12px;border-left:3px solid #0f9f8b;background:#f5f9fb}.info-card h3,.print-detail-grid h3{margin:0 0 5px;color:#29435a;font-size:10pt}.info-card p{margin:0;color:#5f7084}.print-step{display:grid;grid-template-columns:38px 1fr;gap:14px;padding:7mm 0;border-top:1px solid #dfe8ed;break-inside:avoid}.print-step-number{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#0f9f8b;color:#fff;font-weight:800}.print-step-kicker{color:#0f7c70;font-size:8pt;font-weight:800;letter-spacing:.1em}.print-step h2{margin:3px 0 4px;color:#102f4a;font-family:Georgia,serif;font-size:17pt}.print-step p{margin:0 0 8px;color:#5f7084}.print-detail-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:9px}.print-detail-grid section{padding:10px;border:1px solid #dfe8ed;border-radius:8px;background:#fbfdfe}.print-detail-grid ul,.info-card ul{margin:0;padding-left:18px}.print-muted{color:#8795a5!important;font-size:9pt}.footer{margin-top:12mm;padding-top:5mm;border-top:1px solid #dfe8ed;color:#7a8999;font-size:8.5pt}@media print{a{color:inherit;text-decoration:none}.report-nav{display:none}}@media(max-width:650px){.summary-grid,.info-grid,.print-detail-grid{grid-template-columns:1fr}.cover h1{font-size:28pt}}</style></head><body><main class="report"><header class="cover"><div class="brand">Skill2Career AI</div><h1>${esc(targetCareer)}<br>career roadmap</h1><p>A practical, evidence-led plan built from your current profile, readiness result, skill gaps, and next actions.</p><div class="cover-meta"><span class="pill">Prepared ${esc(generatedDate)}</span><span class="pill">${esc(profile.name || "Learner profile")}</span><span class="pill">${esc(profileSummary)}</span></div></header><nav class="report-nav"><a href="#snapshot">Snapshot</a><a href="#profile">Your profile</a><a href="#phases">Roadmap phases</a><a href="${esc(location.origin)}/#/career-journey">Open live roadmap</a></nav><section class="section" id="snapshot"><h2 class="section-title">Your career snapshot</h2><div class="summary-grid"><div class="summary-card"><strong>${esc(matchScore)}%</strong><span>Career match</span></div><div class="summary-card"><strong>${esc(readiness.overallReadiness ?? 0)}%</strong><span>Overall readiness</span></div><div class="summary-card"><strong>${roadmapSteps.length}</strong><span>Roadmap phases</span></div></div></section><section class="section" id="profile"><h2 class="section-title">Profile foundations</h2><div class="info-grid"><div class="info-card"><h3>Education and interests</h3><p>${esc(profileSummary)}</p><p>${esc(detailItems(profile.interests).join(", ") || "Interests not recorded")}</p></div><div class="info-card"><h3>Current skills</h3>${printList(profileSkills, "No selected skills recorded.")}</div><div class="info-card"><h3>Strengths</h3>${printList(readiness.strengths, "Strengths will appear as more evidence is added.")}</div><div class="info-card"><h3>Target skills</h3>${printList(requiredSkills, "No required skills recorded.")}</div></div></section><section class="section" id="phases"><h2 class="section-title">Roadmap phases</h2><p>Use each phase to build evidence, practise deliberately, and update your live roadmap as you progress.</p>${stepMarkup || '<p class="print-muted">Your roadmap phases will appear after the assessment is complete.</p>'}</section><section class="section"><h2 class="section-title">Immediate actions</h2>${printList(visibleActions, "Complete your assessment to unlock recommended actions.")}</section><footer class="footer">This report is generated from your Skill2Career AI session. Open the live roadmap for the latest progress and linked learning resources.</footer></main><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),350));</script></body></html>`,
  );
  printWindow.document.close();
  printWindow.focus();
};
const renderLanding = (content) => {
  app.innerHTML = `<div class="landing-shell"><header class="landing-nav"><a class="landing-brand" href="#/"><span>Skill2Career</span> AI</a><div class="landing-nav-links"><a href="#how-it-works">How it works</a><a href="#/resume-analysis">Resume Analyzer</a><a href="#/mock-interview">Mock Interview</a></div><a class="landing-start" href="#/assessment">Get started <i class="bi bi-arrow-up-right"></i></a></header>${content}<div class="landing-credit">Career clarity, built for your next step</div></div>`;
  app.querySelector(".landing-credit")?.remove();
  enhanceLandingFeatures();
  renderSiteAttribution();
};

const homePage = async () => {
  try {
    const [profile, readiness, matches] = await Promise.all([
      getProfile(),
      getReadiness(),
      api("/api/career-recommendations"),
    ]);
    const match = matches.targetMatch?.matchScore ?? null;
    const target = profile.careerGoal || "Not selected";
    const primaryLabel = profile.profileCompleted
      ? "Continue my journey"
      : "Start skill assessment";
    const primaryLink = profile.profileCompleted
      ? "#/career-journey"
      : "#/assessment";
    renderLanding(
      `<main><section class="landing-hero"><div class="landing-hero-content"><div class="landing-eyebrow"><i class="bi bi-stars"></i> SKILL2CAREER AI</div><h1>Find the career<br>that fits your<br><em>skills</em> and goals.</h1><p class="landing-lead">Turn your current skills into a clear career plan, with practical guidance for your next move.</p><div class="landing-cta-row"><a class="landing-primary" href="${primaryLink}">${primaryLabel} <i class="bi bi-arrow-up-right"></i></a><a class="landing-text-link" href="#how-it-works">See how it works <i class="bi bi-arrow-down"></i></a></div><div class="landing-reassurance"><span><i class="bi bi-check2-circle"></i> Evidence-based career and skill-gap results</span><span><i class="bi bi-check2-circle"></i> Resume Analyzer, learning and Mock Interview guidance</span></div></div><aside class="landing-insight-card"><div class="insight-card-top"><span>YOUR CAREER SNAPSHOT</span><i class="bi bi-sparkle"></i></div><h2>${esc(target)}</h2><p>${profile.profileCompleted ? "Your profile is ready for focused career guidance." : "Start with a short assessment to unlock your personalized snapshot."}</p>${profile.profileCompleted ? "" : '<div class="results-preview"><span>RESULTS YOU WILL UNLOCK</span><div><b><i class="bi bi-bullseye"></i> Career match</b><b><i class="bi bi-bar-chart-line-fill"></i> Skill-gap result</b><b><i class="bi bi-map-fill"></i> Personal roadmap</b></div></div>'}<div class="insight-score"><div class="insight-orbit"><strong>${match === null ? "—" : `${match}%`}</strong><span>match</span></div><div><b>${readiness.ready ? `${readiness.overallReadiness}% readiness` : "Your next step"}</b><small>${readiness.ready ? "based on your current evidence" : "Complete your profile to calculate a match"}</small></div></div><a href="${primaryLink}" class="insight-link">${profile.profileCompleted ? "Open career journey" : "Build my profile"} <i class="bi bi-arrow-right"></i></a></aside></section><section class="landing-trust"><span>Career direction</span><i></i><span>Skill-gap analysis</span><i></i><span>Resume Analyzer</span><i></i><span>Mock Interview</span></section><section class="landing-story" id="how-it-works"><div class="landing-eyebrow">HOW SKILL2CAREER AI WORKS</div><h2>Your assessment becomes a personalized career journey.</h2><p>We compare your selected skills and proficiency levels with career requirements, show your readiness and priority gaps, then guide you with a roadmap, learning resources, the Resume Analyzer and Mock Interview practice.</p><div class="landing-path"><article><span>01</span><i class="bi bi-person-lines-fill"></i><h3>Build your profile</h3><p>Add your education, interests, career goal and current skills to complete the career assessment.</p></article><article><span>02</span><i class="bi bi-diagram-3-fill"></i><h3>Understand your gaps</h3><p>See your career match, readiness score, strengths and the skills you should build next.</p></article><article><span>03</span><i class="bi bi-graph-up-arrow"></i><h3>Take guided action</h3><p>Learn with recommended videos, use the Resume Analyzer, and practise role-specific questions in Mock Interview.</p></article></div></section><section class="landing-bottom-cta"><div><div class="landing-eyebrow">READY WHEN YOU ARE</div><h2>Start with the skills you already have.</h2><p>Complete your assessment to generate your career match, skill-gap result and next steps.</p></div><a class="landing-primary" href="#/assessment">Get my career match <i class="bi bi-arrow-up-right"></i></a></section></main>`,
    );
    return;
    const nextStep = !profile.profileCompleted
      ? [
          "Complete your profile",
          "Tell us about your education, interests and existing skills so we can find your best career fit.",
          "#/assessment",
          "bi-compass-fill",
        ]
      : !profile.resumeAnalysis
        ? [
            "Analyze your resume",
            "Turn your existing resume into clear strengths, missing sections and practical improvements.",
            "#/resume-analysis",
            "bi-file-earmark-check-fill",
          ]
        : [
            "Practice your interview",
            "Review the questions you will face and receive feedback on every response.",
            "#/mock-interview",
            "bi-chat-square-text-fill",
          ];
    const completedSteps = [
      Boolean(profile.profileCompleted),
      Boolean(profile.resumeAnalysis),
      Boolean(profile.interviewScores?.length),
    ].filter(Boolean).length;
    renderShell(
      `<section class="hero-panel modern-hero"><div class="hero-copy"><div class="eyebrow"><i class="bi bi-stars"></i> CAREER READINESS PLATFORM</div><h1>Build a career<br><span>you feel ready for.</span></h1><p>Skill2Career turns your education, skills and ambitions into a focused career plan. Discover where you stand, learn what matters, and move forward with confidence.</p><div class="cta-row"><a class="primary-btn" href="${nextStep[2]}"><i class="bi bi-arrow-up-right-circle-fill"></i> ${esc(nextStep[0])}</a><a class="secondary-btn" href="#/career-journey"><i class="bi bi-bar-chart-line"></i> View my journey</a></div><div class="hero-proof"><span><i class="bi bi-check2-circle"></i> Personal career matching</span><span><i class="bi bi-check2-circle"></i> Actionable skill feedback</span></div></div><div class="hero-card hero-summary"><div class="hero-card-header"><div><div class="card-mini">YOUR CAREER SIGNAL</div><h3>${esc(target)}</h3></div><div class="ring-score">${match === null ? "—" : `${match}%`}</div></div>${match === null ? empty("Complete a quick assessment to unlock a career match built around your profile.", "#/assessment", "Set up my profile") : `<div class="mini-bars"><div class="mini-bar-row"><span>Career Match</span><strong>${match}%</strong></div>${progress(match)}</div>`}<div class="summary-divider"></div><div class="summary-stat-grid"><div><strong>${readiness.ready ? `${readiness.overallReadiness}%` : "—"}</strong><span>Readiness</span></div><div><strong>${profile.skills?.length || 0}</strong><span>Skills tracked</span></div><div><strong>${profile.resumeAnalysis ? "Done" : "Next"}</strong><span>Resume review</span></div></div><div class="hero-tip"><i class="bi bi-lightbulb-fill"></i><span><b>Recommended now:</b> ${esc(nextStep[1])}</span></div></div></section><section class="dashboard-strip"><div><span class="strip-label">YOUR MOMENTUM</span><h2>${completedSteps} of 3 core steps complete</h2><p>Complete your profile, resume analysis and interview practice to build a fuller career-readiness picture.</p></div><div class="step-meter" aria-label="${completedSteps} of 3 core steps complete"><span class="${completedSteps >= 1 ? "complete" : ""}">1</span><i></i><span class="${completedSteps >= 2 ? "complete" : ""}">2</span><i></i><span class="${completedSteps >= 3 ? "complete" : ""}">3</span></div></section><section class="quick-action-section"><div class="section-intro"><div><div class="eyebrow">YOUR NEXT MOVES</div><h2>Everything you need to move forward.</h2></div><p>Choose a guided activity below. Every completed step adds meaningful evidence to your career journey.</p></div><div class="action-card-grid"><a class="action-card ${profile.profileCompleted ? "is-complete" : ""}" href="#/assessment"><span class="action-icon"><i class="bi bi-compass"></i></span><div><small>01 · DISCOVER</small><h3>Career Assessment</h3><p>Map your education, interests and skills to career paths that suit you.</p><b>${profile.profileCompleted ? "Profile complete" : "Build my profile"} <i class="bi bi-arrow-right"></i></b></div></a><a class="action-card ${profile.resumeAnalysis ? "is-complete" : ""}" href="#/resume-analysis"><span class="action-icon teal"><i class="bi bi-file-earmark-text"></i></span><div><small>02 · STRENGTHEN</small><h3>Resume Analyzer</h3><p>See the strengths already visible in your resume and what to improve next.</p><b>${profile.resumeAnalysis ? "Resume analyzed" : "Analyze my resume"} <i class="bi bi-arrow-right"></i></b></div></a><a class="action-card ${profile.interviewScores?.length ? "is-complete" : ""}" href="#/mock-interview"><span class="action-icon orange"><i class="bi bi-chat-square-quote"></i></span><div><small>03 · PRACTICE</small><h3>Mock Interview</h3><p>Preview role-specific questions and practice answering with guided feedback.</p><b>${profile.interviewScores?.length ? "Interview practiced" : "Start practicing"} <i class="bi bi-arrow-right"></i></b></div></a></div></section><section class="journey-panel"><div class="eyebrow center">HOW YOUR JOURNEY WORKS</div><h2 class="journey-title">A clear path from insight to action.</h2><p class="journey-description">Build your profile once, then use every result to make smarter decisions about your next career step.</p><div class="journey-steps"><div class="journey-step"><span>01</span><b>Assess</b><small>Share your goals</small></div><div class="journey-step"><span>02</span><b>Match</b><small>Find your fit</small></div><div class="journey-step"><span>03</span><b>Learn</b><small>Close skill gaps</small></div><div class="journey-step"><span>04</span><b>Improve</b><small>Strengthen resume</small></div><div class="journey-step"><span>05</span><b>Practice</b><small>Build interview confidence</small></div><div class="journey-step"><span>06</span><b>Grow</b><small>Track progress</small></div></div></section>`,
    );
  } catch (error) {
    renderShell(
      `${title("HOME", "Career Readiness")} ${errorBox(error.message)}`,
    );
  }
};

const onboardingPage = async () => {
  try {
    const [profile, careersResult, skillsResult] = await Promise.all([
      getProfile(),
      getCareers(),
      api("/api/skills"),
    ]);
    const careers = careersResult || [];
    const skills = skillsResult.skills || [];
    const chosen = new Map(
      (profile.skills || []).map((item) => [item.skillName, item.proficiency]),
    );
    renderShell(
      `<section class="content-section narrow">${title("ASSESSMENT", "Build your career profile", "Your selected skills and stated proficiency levels determine the match and skill-gap results.")}<div class="panel form-panel"><form id="assessment-form" class="stacked-form"><div class="form-grid two-col"><label><span>Education</span><select name="degree" required><option value="">Select education</option>${["B.Com", "B.Sc", "B.Tech", "MBA", "Diploma", "High School", "Other"].map((value) => `<option ${profile.education?.degree === value ? "selected" : ""}>${value}</option>`).join("")}</select></label><label><span>Specialization</span><input name="branch" value="${esc(profile.education?.branch || "")}" required /></label></div><div class="form-grid two-col"><label><span>Career target</span><select name="careerGoalId" required><option value="">Select career</option>${careers.map((item) => `<option value="${esc(item._id)}" ${profile.careerGoalId === item._id ? "selected" : ""}>${esc(item.name)}</option>`).join("")}</select></label><label><span>Interests, separated by commas</span><input name="interests" value="${esc((profile.interests || []).join(", "))}" required /></label></div><label><span>Search skills</span><input id="skill-search" placeholder="Type a skill name" autocomplete="off" /></label><div id="skill-tags" class="skill-tags"></div><label><span>Proficiency for selected skills</span><select id="skill-level"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label><div id="selected-skill-list" class="empty-state">Select skills and set their proficiency.</div><button class="primary-btn" type="submit">Save profile and calculate match</button><div id="assessment-error"></div></form></div></section>`,
    );
    const drawSkills = () => {
      const query = document
        .querySelector("#skill-search")
        .value.trim()
        .toLowerCase();
      const matches = skills
        .filter((item) => item.name.toLowerCase().includes(query))
        .slice(0, 24);
      document.querySelector("#skill-tags").innerHTML = matches
        .map(
          (item) =>
            `<button type="button" class="skill-tag${chosen.has(item.name) ? " selected" : ""}" data-skill="${esc(item.name)}">${esc(item.name)}</button>`,
        )
        .join("");
      document.querySelector("#selected-skill-list").textContent = chosen.size
        ? [...chosen].map(([name, level]) => `${name}: ${level}`).join(" · ")
        : "Select skills and set their proficiency.";
    };
    drawSkills();
    document
      .querySelector("#skill-search")
      .addEventListener("input", drawSkills);
    document
      .querySelector("#skill-level")
      .addEventListener("change", (event) => {
        for (const skill of chosen.keys())
          chosen.set(skill, event.target.value);
        drawSkills();
      });
    document.querySelector("#skill-tags").addEventListener("click", (event) => {
      const button = event.target.closest("[data-skill]");
      if (!button) return;
      const name = button.dataset.skill;
      if (chosen.has(name)) chosen.delete(name);
      else chosen.set(name, document.querySelector("#skill-level").value);
      drawSkills();
    });
    document
      .querySelector("#assessment-form")
      .addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const interests = String(form.get("interests"))
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
        const selectedSkills = [...chosen].map(([skillName, proficiency]) => ({
          skillName,
          proficiency,
        }));
        if (!selectedSkills.length) {
          document.querySelector("#assessment-error").innerHTML = errorBox(
            "Select at least one actual skill and proficiency.",
          );
          return;
        }
        try {
          await api("/api/student/profile", {
            method: "PUT",
            body: JSON.stringify({
              education: {
                degree: form.get("degree"),
                branch: form.get("branch"),
              },
              interests,
              careerGoalId: form.get("careerGoalId"),
              skills: selectedSkills,
            }),
          });
          const assessment = await api("/api/ai/assessment", {
            method: "POST",
            body: JSON.stringify({ careerId: form.get("careerGoalId") }),
          });
          await api("/api/ai/generate-roadmap", {
            method: "POST",
            body: JSON.stringify({ careerId: form.get("careerGoalId") }),
          });
          app.dataset.assessment = JSON.stringify(assessment.assessment);
          location.hash = "#/career-journey";
        } catch (error) {
          document.querySelector("#assessment-error").innerHTML = errorBox(
            error.message,
          );
        }
      });
  } catch (error) {
    renderShell(
      `${title("ASSESSMENT", "Build your career profile")} ${errorBox(error.message)}`,
    );
  }
};

const careerJourneyPage = async () => {
  try {
    const [profile, readiness, actionPlan, matches] = await Promise.all([
      getProfile(),
      getReadiness(),
      api("/api/action-plan"),
      api("/api/career-recommendations"),
    ]);
    if (!profile.profileCompleted || !readiness.ready) {
      renderShell(
        `${title("MY CAREER JOURNEY", "Complete your career assessment")} ${empty("Complete your assessment to calculate your career match, readiness, and personalized actions.", "#/assessment", "Start Career Assessment")}`,
      );
      return;
    }

    let roadmapResult = await api("/api/ai/roadmap");
    if (!roadmapResult.roadmap) {
      roadmapResult = await api("/api/ai/generate-roadmap", {
        method: "POST",
        body: JSON.stringify({ careerId: profile.careerGoalId }),
      });
    }

    const gaps = readiness.skillGap.missingSkills.concat(
      readiness.skillGap.partialGaps,
    );
    const interviewScores = (profile.interviewScores || [])
      .filter(
        (item) =>
          typeof item === "number" ||
          item.targetCareer === readiness.targetCareer,
      )
      .map((item) => (typeof item === "number" ? item : item.score));
    const interviewScore = interviewScores.length
      ? Math.round(
          interviewScores.reduce((sum, score) => sum + score, 0) /
            interviewScores.length,
        )
      : null;
    const categoryNames = {
      technicalSkills: "Technical Skills",
      resume: "Resume",
      certifications: "Certifications",
      interview: "Interview",
      communication: "Communication",
    };
    const metrics = Object.entries(readiness.categoryScores)
      .filter(([key, score]) => key !== "projects" && Number.isFinite(score))
      .map(
        ([key, score]) =>
          `<div class="metric-card"><div class="metric-header"><span>${categoryNames[key]}</span><strong>${score}%</strong></div>${progress(score)}</div>`,
      )
      .join("");
    const actions = [
      ["Complete career assessment", true],
      ["Analyze your resume", Boolean(profile.resumeAnalysis)],
      ["Practice a mock interview", interviewScore !== null],
    ];
    const visibleActions = actionPlan.nextFiveActions.filter(
      (action) => !/project|portfolio/i.test(action),
    );
    const roadmapSteps = (roadmapResult.roadmap?.steps || []).filter(
      (step) =>
        !/project|portfolio/i.test(
          `${step.title || ""} ${step.skill || ""} ${step.description || ""}`,
        ),
    );

    renderShell(`<section class="content-section">
      ${title("CAREER RESULT", "My Career Journey", "Your career result and next steps, connected to evidence from your profile and completed analyses.")}
      <div class="readiness-top-card">
        <div><div class="eyebrow">YOUR CAREER TARGET</div><h2>${esc(readiness.targetCareer)}</h2><p>${esc(matches.targetMatch?.why || "")}</p></div>
        <div><div class="card-mini">Career Match</div><div class="big-readiness">${matches.targetMatch?.matchScore ?? readiness.skillGap.matchScore}%</div><a class="primary-btn" href="#career-action-plan">Build My Career Plan</a></div>
      </div>
      <div class="journey-tabs" role="tablist" aria-label="Career result sections">
        <button type="button" class="journey-tab active" role="tab" aria-selected="true" data-journey-tab="overview">Overview</button>
        <button type="button" class="journey-tab" role="tab" aria-selected="false" data-journey-tab="actions">Skills &amp; Actions<span class="journey-tab-count">${gaps.length}</span></button>
        <button type="button" class="journey-tab" role="tab" aria-selected="false" data-journey-tab="roadmap">Roadmap<span class="journey-tab-count">${roadmapSteps.length}</span></button>
      </div>
      <section class="journey-section" data-journey-group="overview" role="tabpanel" tabindex="0">
        <h2>Career Readiness</h2>
        <div class="readiness-top-card"><div><div class="eyebrow">OVERALL READINESS</div><div class="big-readiness">${readiness.overallReadiness}%</div></div><span class="tag">Evidence-based session score</span></div>
        <div class="metric-grid readiness-metrics">${metrics || "<p>No additional analysis scores yet. Resume, certification, and interview scores appear after those analyses are completed.</p>"}</div>
      </section>
      <section class="journey-section" data-journey-group="overview" role="tabpanel" tabindex="0">
        <h2>Why this career fits you</h2>
        <div class="two-column-layout">
          <div class="panel"><h3>Your strengths</h3><ul class="check-list">${list(readiness.strengths, (item) => `<li>${esc(item)}</li>`, "No strengths matched to role requirements yet")}</ul></div>
          <div class="panel"><h3>Required skills</h3><ul class="check-list">${list(readiness.skillGap.requiredSkills, (item) => `<li>${esc(item.skillName)} · ${esc(item.requiredLevel)}${item.studentLevel ? ` · your level: ${esc(item.studentLevel)}` : " · not recorded"}</li>`, "No listed requirements for this career")}</ul></div>
        </div>
      </section>
      <section class="journey-section" data-journey-group="actions" role="tabpanel" tabindex="0" hidden>
        <h2>Your Skill Gaps</h2>
        ${gaps.length ? `<div class="feature-grid">${gaps.map((item) => `<article class="feature-card"><h3>${esc(item.skillName)}</h3><p>Required for ${esc(readiness.targetCareer)} at ${esc(item.requiredLevel)} level. Current level: ${esc(item.studentLevel || "not recorded")}.</p><button class="secondary-btn" type="button" data-learn-skill="${esc(item.skillName)}">Learn ${esc(item.skillName)}</button><div class="inline-learning" data-learning-results="${esc(item.skillName)}"></div></article>`).join("")}</div>` : '<div class="empty-state">No skill gaps found in the current assessment.</div>'}
      </section>
      <section class="journey-section" id="career-action-plan" data-journey-group="actions" role="tabpanel" tabindex="0" hidden>
        <h2>What You Need to Do Next</h2>
        <div class="two-column-layout"><div class="panel"><ol class="action-list">${visibleActions.map((item) => `<li>${esc(item)}</li>`).join("")}</ol></div><div class="panel"><h3>Action Plan</h3><ul class="check-list">${actions.map(([label, complete]) => `<li>${complete ? "Complete" : "To do"} · ${esc(label)}</li>`).join("")}${gaps.map((item) => `<li>Recommended · Learn ${esc(item.skillName)}</li>`).join("")}</ul></div></div>
      </section>
      <section class="journey-section" data-journey-group="roadmap" role="tabpanel" tabindex="0" hidden>
        <div class="roadmap-heading-row"><div><h2>Your Career Roadmap</h2><p class="roadmap-intro">A focused sequence of phases to turn your skill gaps into visible career evidence.</p></div><button type="button" class="primary-btn roadmap-download" data-download-roadmap><i class="bi bi-file-earmark-arrow-down" aria-hidden="true"></i> Download roadmap PDF</button></div>
        <div class="roadmap-summary"><div><strong>${roadmapSteps.length}</strong><span>Phases to follow</span></div><div><strong>${gaps.length}</strong><span>Priority skills</span></div><div><strong>${readiness.overallReadiness}%</strong><span>Current readiness</span></div></div>
        <div class="timeline-list roadmap-list">${roadmapSteps
          .map(
            (step, index) =>
              `<article class="timeline-item roadmap-step-card"><div class="timeline-number">${index + 1}</div><div class="timeline-body"><div class="roadmap-step-meta"><span>PHASE ${index + 1}</span><span>${esc(step.skill || "Career development")}</span></div><h3>${esc(step.title)}</h3><p>${esc(step.description)}</p><div class="roadmap-detail-grid"><div><h4><i class="bi bi-check2-circle" aria-hidden="true"></i> What to do</h4>${
                detailItems(step.tasks).length
                  ? `<ul>${detailItems(step.tasks)
                      .map((task) => `<li>${esc(task)}</li>`)
                      .join("")}</ul>`
                  : "<p>Add a practical task and document the result.</p>"
              }</div><div><h4><i class="bi bi-folder2-open" aria-hidden="true"></i> Evidence to build</h4>${
                detailItems(step.projects).length
                  ? `<ul>${detailItems(step.projects)
                      .map(
                        (project) =>
                          `<li>${esc(typeof project === "string" ? project : project.title || project.name || project.description || "")}</li>`,
                      )
                      .join("")}</ul>`
                  : "<p>Create a work sample that demonstrates this skill.</p>"
              }</div></div></div></article>`,
          )
          .join("")}</div>
      </section>
    </section>`);

    const tabs = document.querySelectorAll("[data-journey-tab]");
    const panels = document.querySelectorAll("[data-journey-group]");
    const activateTab = (tabId) => {
      tabs.forEach((tab) => {
        const selected = tab.dataset.journeyTab === tabId;
        tab.classList.toggle("active", selected);
        tab.setAttribute("aria-selected", String(selected));
      });
      panels.forEach((panel) => {
        panel.hidden = panel.dataset.journeyGroup !== tabId;
      });
    };
    tabs.forEach((tab) =>
      tab.addEventListener("click", () => activateTab(tab.dataset.journeyTab)),
    );
    document
      .querySelector("[data-download-roadmap]")
      ?.addEventListener("click", () =>
        openRoadmapPrintView({
          profile,
          readiness,
          roadmap: roadmapResult.roadmap,
          roadmapSteps,
          visibleActions,
        }),
      );
    document
      .querySelector('a[href="#career-action-plan"]')
      ?.addEventListener("click", (event) => {
        event.preventDefault();
        activateTab("actions");
        document
          .querySelector("#career-action-plan")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    document.querySelectorAll("[data-learn-skill]").forEach((button) =>
      button.addEventListener("click", async () => {
        const skill = button.dataset.learnSkill;
        const output = document.querySelector(
          `[data-learning-results="${CSS.escape(skill)}"]`,
        );
        button.disabled = true;
        try {
          const result = await api(
            `/api/youtube-learning/${encodeURIComponent(skill)}`,
          );
          output.innerHTML = result.videos?.length
            ? `<h4>Learning ${esc(skill)}</h4>${result.videos.map((video) => `<article class="video-card"><div class="video-thumb" style="background-image:url('${esc(video.thumbnail)}')"></div><div class="video-card-body"><h4>${esc(video.title)}</h4><p>${esc(video.channel)}</p><a class="small-link" href="${esc(video.url)}" target="_blank" rel="noreferrer">Watch on YouTube</a></div></article>`).join("")}`
            : errorBox(
                result.message || "Learning search is currently unavailable.",
              );
        } catch (error) {
          output.innerHTML = errorBox(error.message);
        } finally {
          button.disabled = false;
        }
      }),
    );
  } catch (error) {
    renderShell(
      `${title("MY CAREER JOURNEY", "Career result")} ${errorBox(error.message)}`,
    );
  }
};

const resumePage = async () => {
  let profile;
  try {
    profile = await getProfile();
  } catch (error) {
    renderShell(
      `${title("AI RESUME ANALYZER", "Resume analysis")} ${errorBox(error.message)}`,
    );
    return;
  }
  renderShell(
    `<section class="content-section narrow">${title("AI RESUME ANALYZER", "Analyze your resume", "Upload a PDF, DOCX, or TXT file. Text is extracted in memory and is not stored as a file.")}<div class="panel upload-panel"><form id="resume-form" class="stacked-form"><label class="upload-box" for="resume-upload"><span>📄 Upload Resume</span><small>PDF / DOCX / TXT</small><input id="resume-upload" type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" required /></label><button class="primary-btn" type="submit">Analyze Resume</button><div id="resume-error"></div><div id="resume-upload-status" class="upload-status" role="status" aria-live="polite">No file selected</div></form><div id="resume-result">${profile.resumeAnalysis ? `${renderResume(profile.resumeAnalysis)}${renderResumeCareerImpact(profile.resumeAnalysis.careerImpact, profile.resumeAnalysis.resumeCareerMatches)}` : empty("No resume analyzed yet.", "#/resume-analysis", "Choose a file above")}</div></div></section>`,
  );
  cleanRenderedUi(document.querySelector("#resume-result"));
  document
    .querySelector("#resume-upload")
    .addEventListener("change", (event) => {
      const selectedFile = event.target.files[0];
      const status = document.querySelector("#resume-upload-status");
      status.textContent = selectedFile
        ? `Selected: ${selectedFile.name} (${Math.max(1, Math.round(selectedFile.size / 1024))} KB). Ready to analyze.`
        : "No file selected";
    });
  document
    .querySelector("#resume-form")
    .addEventListener("submit", async (event) => {
      event.preventDefault();
      const file = document.querySelector("#resume-upload").files[0];
      const error = document.querySelector("#resume-error");
      if (!file) {
        error.innerHTML = errorBox("Choose a resume file before analyzing.");
        return;
      }
      const body = new FormData();
      body.append("resume", file);
      const button = event.currentTarget.querySelector('button[type="submit"]');
      button.disabled = true;
      button.textContent = "Analyzing…";
      try {
        const result = await api("/api/ai/analyze-resume", {
          method: "POST",
          body,
        });
        document.querySelector("#resume-result").innerHTML =
          `${result.analysisNotice ? errorBox(result.analysisNotice) : ""}${renderResume(result)}${renderResumeCareerImpact(result.careerImpact, result.resumeCareerMatches)}`;
        document.querySelector("#resume-upload-status").textContent =
          `Uploaded and analyzed: ${file.name}`;
        cleanRenderedUi(document.querySelector("#resume-result"));
        error.innerHTML = "";
      } catch (exception) {
        error.innerHTML = errorBox(
          exception.message ||
            "Analysis failed. Please try another valid file.",
        );
      } finally {
        button.disabled = false;
        button.textContent = "Analyze Resume";
      }
    });
};
const renderResume = (data) =>
  `<div class="metric-grid"><div class="metric-card"><div class="metric-header"><span>Resume Score</span><strong>${data.resumeScore}%</strong></div>${progress(data.resumeScore)}</div><div class="metric-card"><div class="metric-header"><span>Skills Found</span><strong>${data.skills.length}</strong></div><ul class="check-list">${list(data.skills, (skill) => `<li>${esc(skill.name)} <small>${esc(skill.evidence)}</small></li>`, "No skills detected")}</ul></div><div class="metric-card"><div class="metric-header"><span>Projects Found</span><strong>${data.projects.length}</strong></div><ul class="check-list">${list(data.projects, (project) => `<li>${esc(project.name)}${project.technologies.length ? `: ${esc(project.technologies.join(", "))}` : ""}</li>`, "No projects detected")}</ul></div></div><div class="two-column-layout"><div class="panel"><h3>Education</h3><ul class="check-list">${list(data.education, (item) => `<li>${esc(item.evidence)}</li>`, "No education detected")}</ul></div><div class="panel"><h3>Experience and Internships</h3><ul class="check-list">${list(data.experience.concat(data.internships), (item) => `<li>${esc(item.evidence)}</li>`, "No experience detected")}</ul></div><div class="panel"><h3>Certifications</h3><ul class="check-list">${list(data.certifications, (item) => `<li>${esc(item.evidence)}</li>`, "No certifications detected")}</ul></div><div class="panel"><h3>Achievements</h3><ul class="check-list">${list(data.achievements, (item) => `<li>${esc(item.evidence)}</li>`, "No achievements detected")}</ul></div></div><div class="panel"><h3>Missing or Weak Sections</h3>${data.missingSections.length ? `<ul class="check-list warning-list">${data.missingSections.map((section) => `<li>${esc(section)}</li>`).join("")}</ul>` : "<p>No missing sections were detected by the text analysis.</p>"}<h3>Recommendations</h3>${data.recommendations.length ? `<ol class="action-list">${data.recommendations.map((item) => `<li>${esc(item)}</li>`).join("")}</ol>` : "<p>No recommendations from the detected content.</p>"}</div>`;
const renderResumeCareerImpact = (impact, matches = []) => {
  if (impact)
    return `<div class="panel"><h3>Resume Fit · ${esc(impact.targetCareer)}</h3><p>${impact.coveredSkills.length} of ${impact.requiredSkillCount} listed career skills were detected in this resume.</p><p>Detected for this career: ${impact.coveredSkills.map(esc).join(", ") || "None"}</p><p>Not found in resume: ${impact.missingSkills.map(esc).join(", ") || "None"}</p><a class="primary-btn" href="#/career-journey">View My Career Journey</a></div>`;
  if (!matches.length)
    return `<div class="panel"><h3>Career Matches from Your Resume</h3><p>Not enough career-related skills were detected to suggest a match. Add skills to your resume and analyze it again.</p></div>`;
  return `<div class="panel resume-career-matches"><h3>Careers That Match Your Resume</h3><p>Ranked by overlap between your detected resume skills and each career's required skills.</p><div class="resume-match-list">${matches.map((match, index) => `<article class="resume-match-item"><div class="resume-match-rank">${index + 1}</div><div class="resume-match-content"><h4>${esc(match.career)}</h4><p>${match.matchedSkills.length} of ${match.requiredSkillCount} required skills found: ${match.matchedSkills.map(esc).join(", ")}</p>${match.missingSkills.length ? `<small>Skills to build: ${match.missingSkills.map(esc).join(", ")}</small>` : "<small>All listed skills detected in the resume</small>"}</div><strong class="resume-match-score">${match.matchScore}%</strong></article>`).join("")}</div><a class="primary-btn" href="#/assessment">Choose a Career Target</a></div>`;
};
const interviewPage = async () => {
  try {
    const [profile, careers] = await Promise.all([getProfile(), getCareers()]);
    renderShell(
      `<section class="content-section narrow">${title("AI MOCK INTERVIEW", "Practice for your selected career", "Preview the role-specific questions first, then receive feedback after every answer.")}<div class="panel interview-panel"><form id="interview-start" class="interview-start"><label><span>Select Career</span><select name="careerId" required><option value="">Select career</option>${careers.map((career) => `<option value="${esc(career._id)}" ${profile.careerGoalId === career._id ? "selected" : ""}>${esc(career.name)}</option>`).join("")}</select></label><label><span>Select Difficulty</span><select name="difficulty"><option>Beginner</option><option selected>Intermediate</option><option>Advanced</option></select></label><button class="primary-btn" type="submit">Start Interview</button></form><div id="interview-error"></div><div id="interview-preview" class="interview-preview" aria-live="polite"></div><div id="interview-output">${empty("Review the question plan above, then start when you are ready.", "#/mock-interview", "Choose career and difficulty above")}</div></div></section>`,
    );
    const preview = document.querySelector("#interview-preview");
    const formElement = document.querySelector("#interview-start");
    const renderPreview = (data) =>
      `<div class="preview-heading"><div><div class="eyebrow">YOUR INTERVIEW PLAN</div><h3>Questions for ${esc(data.career)}</h3></div><span class="tag"><i class="bi bi-list-check"></i> ${data.questions.length} questions</span></div><p class="preview-copy">You will answer these ${esc(data.difficulty.toLowerCase())}-level questions one at a time. Your response is scored and followed by practical feedback.</p><ol class="question-preview-list">${data.questions.map((question) => `<li><span class="question-number">${question.id}</span><div><strong>${esc(question.question)}</strong><small>Focus: ${esc(question.topic)}</small></div></li>`).join("")}</ol>`;
    const updatePreview = async () => {
      const form = new FormData(formElement);
      if (!form.get("careerId")) {
        preview.innerHTML =
          '<div class="empty-state">Select a career to see the exact questions you will be asked.</div>';
        return;
      }
      preview.innerHTML =
        '<div class="preview-loading"><i class="bi bi-arrow-repeat"></i> Preparing your question plan…</div>';
      try {
        preview.innerHTML = renderPreview(
          await api(
            `/api/interview/preview?careerId=${encodeURIComponent(form.get("careerId"))}&difficulty=${encodeURIComponent(form.get("difficulty"))}&type=Technical`,
          ),
        );
      } catch (error) {
        preview.innerHTML = errorBox(error.message);
      }
    };
    formElement
      .querySelectorAll("select")
      .forEach((select) => select.addEventListener("change", updatePreview));
    updatePreview();
    formElement.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      try {
        const session = await api("/api/interview/start", {
          method: "POST",
          body: JSON.stringify({
            careerId: form.get("careerId"),
            difficulty: form.get("difficulty"),
            type: "Technical",
          }),
        });
        if (!session.questions?.length)
          throw new Error("The interview service did not return a question.");
        showQuestion(session, session.questions[0]);
        document.querySelector("#interview-error").innerHTML = "";
      } catch (error) {
        document.querySelector("#interview-error").innerHTML = errorBox(
          error.message,
        );
      }
    });

    const showQuestion = (session, question) => {
      const output = document.querySelector("#interview-output");
      output.innerHTML = `<div class="interview-question-box"><div class="eyebrow">QUESTION ${session.questions.findIndex((item) => item.id === question.id) + 1}</div><h3>${esc(session.career)}</h3><p>${esc(question.question)}</p><textarea id="interview-answer" rows="5" placeholder="Write your answer" required></textarea><button class="primary-btn" id="submit-answer" type="button">Submit Answer</button><div id="answer-feedback"></div></div>`;
      document
        .querySelector("#submit-answer")
        .addEventListener("click", async () => {
          const answer = document.querySelector("#interview-answer").value;
          const submitButton = document.querySelector("#submit-answer");
          const feedback = document.querySelector("#answer-feedback");
          submitButton.disabled = true;
          submitButton.textContent = "Analyzing your answer...";
          feedback.innerHTML =
            '<div class="empty-state" role="status">Analyzing your answer against the question. This may take a few seconds.</div>';
          try {
            const result = await api("/api/interview/answer", {
              method: "POST",
              body: JSON.stringify({ sessionId: session.sessionId, answer }),
            });
            feedback.innerHTML = `${result.evaluationNotice ? errorBox(result.evaluationNotice) : ""}<div class="panel"><div class="roadmap-header"><span class="tag">${result.evaluationSource === "ai" ? "AI analysis" : "Answer analysis"}</span><span>${result.evaluationSource === "ai" ? "Evaluated against your question and answer" : "Deterministic answer-based evaluation"}</span></div><div class="metric-header"><span>Answer score</span><strong>${result.score}%</strong></div>${progress(result.score)}<p>${esc(result.feedback)}</p><h4>Strengths</h4><ul class="check-list">${list(result.strengths, (item) => `<li>${esc(item)}</li>`, "No strengths identified in this answer")}</ul><h4>Areas to improve</h4><ul class="check-list warning-list">${list(result.weaknesses, (item) => `<li>${esc(item)}</li>`, "No weaknesses identified")}</ul></div>`;
            if (result.complete) {
              const final = await api(
                `/api/interview/results?sessionId=${encodeURIComponent(session.sessionId)}`,
              );
              feedback.innerHTML += `<div class="panel"><h3>Interview complete</h3><div class="big-readiness">${final.averageScore}%</div><p>Average from ${final.answerCount} submitted answer(s).</p><a href="#/career-journey" class="primary-btn">View updated career journey</a></div>`;
            } else {
              const next = document.createElement("button");
              next.type = "button";
              next.className = "primary-btn";
              next.textContent = "Next Question";
              next.addEventListener("click", () =>
                showQuestion(session, result.nextQuestion),
              );
              feedback.append(next);
            }
          } catch (error) {
            feedback.innerHTML = errorBox(error.message);
          } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Submit Answer";
          }
        });
    };
  } catch (error) {
    renderShell(
      `${title("AI MOCK INTERVIEW", "Practice interview")} ${errorBox(error.message)}`,
    );
  }
};

const handleRoute = async () => {
  const path = decodeURI(location.hash.replace(/^#/, "") || "/");
  if (path === "/") return homePage();
  if (path === "/assessment" || path === "/onboarding") return onboardingPage();
  if (
    path === "/career-journey" ||
    path === "/career-result" ||
    path === "/career-readiness" ||
    path === "/dashboard" ||
    path === "/assessment-results"
  )
    return careerJourneyPage();
  if (path === "/learning" || path.startsWith("/learning/"))
    return careerJourneyPage();
  if (path === "/resume-analysis") return resumePage();
  if (path === "/project-analysis" || path === "/roadmap")
    return careerJourneyPage();
  if (path === "/mock-interview") return interviewPage();
  if (path.startsWith("/career/")) return careerJourneyPage();
  return homePage();
};
window.addEventListener("hashchange", handleRoute);
handleRoute();
