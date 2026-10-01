function addPdfExport() {
  const page = document.querySelector(".results-shell,.timeline");
  if (!page || document.querySelector(".pdf-export-btn")) return;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn btn-outline-primary pdf-export-btn";
  button.innerHTML =
    '<i class="bi bi-download" aria-hidden="true"></i> Download PDF';
  const heading =
    page.closest("section")?.querySelector("h1") || page.querySelector("h1");
  heading?.parentElement?.append(button);
  button.onclick = () => {
    const watermark = document.createElement("div");
    watermark.className = "pdf-watermark";
    watermark.textContent = "Skill2Career AI | Career guidance report";
    document.body.append(watermark);
    document.body.classList.add("printing-pdf");
    document
      .querySelectorAll(
        ".career-finder-side,.finder-output,.results-tabs,.pdf-export-btn,[data-id]",
      )
      .forEach((element) => element.classList.add("exclude-from-pdf"));
    const cleanup = () => {
      document.body.classList.remove("printing-pdf");
      watermark.remove();
      document
        .querySelectorAll(".exclude-from-pdf")
        .forEach((element) => element.classList.remove("exclude-from-pdf"));
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
  };
}
document.addEventListener("DOMContentLoaded", () => {
  const appRoot = document.querySelector("#app");
  if (!appRoot) return;
  const observe = new MutationObserver(() => {
    document.querySelectorAll("[data-id]").forEach((button) => button.remove());
    addPdfExport();
  });
  observe.observe(appRoot, { childList: true, subtree: true });
  addPdfExport();
});
