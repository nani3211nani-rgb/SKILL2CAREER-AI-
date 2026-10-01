const api = async (url, options = {}) => {
  const r = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Request failed");
  return d;
};
const html = (s) =>
  String(s || "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
document.addEventListener("DOMContentLoaded", async () => {
  const path = location.pathname;
  document
    .querySelector("#onboardingForm")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();
      let d = Object.fromEntries(new FormData(e.target));
      d.education = { degree: d.degree, branch: d.branch, year: +d.year };
      d.interests = d.interests
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
      try {
        await api("/api/student/profile", {
          method: "PUT",
          body: JSON.stringify(d),
        });
        location = "/careers";
      } catch (x) {
        alert(x.message);
      }
    });
  if (path === "/careers") {
    try {
      let d = await api("/api/careers");
      document.querySelector("#careerList").innerHTML = d.careers
        .map(
          (c) =>
            `<div class="col-md-6 col-lg-4"><div class="card career-card"><small>${html(c.industry)}</small><h3>${html(c.name)}</h3><p>${html(c.description)}</p><p>${c.match_score === null ? "Sign in for your match" : `<b>${c.match_score}% match</b>`}</p><a class="btn btn-outline-primary" href="/career/${c._id}">View career</a></div></div>`,
        )
        .join("");
    } catch (x) {
      alert(x.message);
    }
  }
  if (path.startsWith("/career/")) {
    try {
      let c = (await api("/api/careers/" + path.split("/").pop())).career;
      let skills = c.skills
        .map(
          (s) =>
            `<li>${html(s.skill_name)} <span class="badge text-bg-light">${s.required_level}</span></li>`,
        )
        .join("");
      document.querySelector("#careerDetail").innerHTML =
        `<span class="eyebrow">${html(c.industry)}</span><h1>${html(c.name)}</h1><p class="lead">${html(c.description)}</p><div class="card p-4"><h4>Required skills</h4><ul>${skills}</ul><a class="btn btn-primary" href="/skill-gap/${c._id}">View my skill gap</a> <button class="btn btn-outline-primary" id="generate">Generate my roadmap</button></div>`;
      document.querySelector("#generate").onclick = async () => {
        try {
          await api("/api/ai/generate-roadmap", {
            method: "POST",
            body: JSON.stringify({ career_id: c._id }),
          });
          location = "/roadmap";
        } catch (x) {
          alert(x.message);
        }
      };
    } catch (x) {
      document.querySelector("#careerDetail").innerHTML =
        '<div class="empty">' + html(x.message) + "</div>";
    }
  }
  if (path === "/dashboard") {
    try {
      let u = (await api("/api/student/profile")).student,
        r = (await api("/api/roadmap")).roadmap;
      welcome.textContent = "Welcome, " + u.name + "!";
      goal.textContent = u.career_goal || "Choose a goal";
      progressText.textContent = (r?.progress || 0) + "%";
      match.textContent = r ? r.match_score + "%" : "—";
      if (r)
        roadmapPreview.innerHTML = r.steps
          .map(
            (s) =>
              `<div>${s.status === "completed" ? "✓" : "○"} ${html(s.title)}</div>`,
          )
          .join("");
    } catch (x) {
      location = "/login";
    }
  }
  if (path === "/roadmap") {
    try {
      let r = (await api("/api/roadmap")).roadmap;
      roadmapList.innerHTML = r
        ? r.steps
            .map(
              (s) =>
                `<article class="step"><small>${html(s.estimated_stage)}</small><h4>${html(s.title)}</h4><p>${html(s.description)}</p><p><b>Project:</b> ${html((s.projects || []).join(", "))}</p><button class="btn btn-sm btn-outline-primary" data-step="${s.step_id}" data-status="${s.status}">${s.status === "completed" ? "Completed" : "Mark complete"}</button></article>`,
            )
            .join("")
        : '<div class="empty">No roadmap yet. Generate one from a career page.</div>';
      document.querySelectorAll("[data-step]").forEach(
        (b) =>
          (b.onclick = async () => {
            await api("/api/roadmap/" + r._id + "/step/" + b.dataset.step, {
              method: "PUT",
              body: JSON.stringify({ status: "completed" }),
            });
            location.reload();
          }),
      );
    } catch (x) {
      alert(x.message);
    }
  }
  if (path === "/resources" || path === "/projects") {
    let d = await api(
      "/api/resources?type=" + (path === "/projects" ? "Project" : ""),
    );
    resourceList.innerHTML = d.resources
      .map(
        (x) =>
          `<div class="col-md-4"><div class="card p-3"><small>${html(x.type)} · ${html(x.level)}</small><h5>${html(x.title)}</h5><p>${html(x.description)}</p>${x.url ? `<a href="${html(x.url)}" target="_blank">Open resource</a>` : '<span class="text-muted">Resource link unavailable</span>'}</div></div>`,
      )
      .join("");
  }
  document.querySelector("#chatForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    let q = new FormData(e.target).get("question"),
      box = chatMessages;
    box.innerHTML += `<div class="message user">${html(q)}</div>`;
    try {
      let d = await api("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({ question: q }),
      });
      box.innerHTML += `<div class="message">${html(d.response.answer)}</div>`;
    } catch (x) {
      box.innerHTML += `<div class="message">${html(x.message)}</div>`;
    }
    e.target.reset();
  });
});
