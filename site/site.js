document.addEventListener("DOMContentLoaded", () => {
  const copyText = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-1000px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  };

  document.querySelectorAll(".code-card").forEach((card) => {
    const header = card.querySelector("header");
    const code = card.querySelector("pre code");

    if (!header || !code || header.querySelector(".copy-button")) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "copy-button";
    button.textContent = "Copy";
    button.setAttribute("aria-label", "Copy code snippet");
    button.setAttribute("aria-live", "polite");

    button.addEventListener("click", async () => {
      try {
        await copyText(code.textContent.trim());
        button.textContent = "Copied";
      } catch {
        button.textContent = "Failed";
      }

      window.setTimeout(() => {
        button.textContent = "Copy";
      }, 1600);
    });

    header.appendChild(button);
  });
});
