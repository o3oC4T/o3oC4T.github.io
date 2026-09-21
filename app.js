(() => {
  "use strict";

  const data = window.PORTFOLIO_DATA;
  const profile = data.profile;
  const projects = data.projects;
  const world = document.querySelector("#project-world");
  const layer = document.querySelector("#project-layer");
  const viewport = document.querySelector(".archive__viewport");
  const projectTemplate = document.querySelector("#project-template");
  const panelShell = document.querySelector("#panel-shell");
  const panelContent = document.querySelector("#panel-content");
  const panelLabel = document.querySelector(".panel__index");
  const glow = document.querySelector(".cursor-glow");
  const mobileQuery = window.matchMedia("(max-width: 760px)");

  const state = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    dragging: false,
    moved: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    activePanel: null,
    lastFocus: null,
  };

  const escapeHtml = (value = "") =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const makeArt = (project, withNumber = true) => {
    const art = document.createElement("span");
    art.className = `project-card__art art--${project.art}`;
    art.style.setProperty("--p1", project.palette[0]);
    art.style.setProperty("--p2", project.palette[1]);
    art.style.setProperty("--p3", project.palette[2]);

    if (project.image) {
      art.style.backgroundImage = `url(${JSON.stringify(project.image).slice(1, -1)})`;
      art.style.backgroundSize = "cover";
      art.style.backgroundPosition = "center";
    }

    for (let index = 1; index <= 3; index += 1) {
      const shape = document.createElement("span");
      const word = ["one", "two", "three"][index - 1];
      shape.className = `art-shape art-shape--${word}`;
      art.append(shape);
    }

    if (withNumber) {
      const number = document.createElement("span");
      number.className = "project-card__number";
      number.textContent = `INDEX / ${String(project.index + 1).padStart(2, "0")}`;
      art.append(number);
    }
    return art;
  };

  function renderProjects() {
    layer.innerHTML = "";
    projects.forEach((project, index) => {
      project.index = index;
      const card = projectTemplate.content.firstElementChild.cloneNode(true);
      const artSlot = card.querySelector(".project-card__art");
      const art = makeArt(project);
      artSlot.replaceWith(art);

      card.style.setProperty("--x", project.position.x);
      card.style.setProperty("--y", project.position.y);
      card.style.setProperty("--rotate", `${project.position.rotate}deg`);
      card.dataset.size = project.position.size;
      card.setAttribute("aria-label", `${project.title} 프로젝트 자세히 보기`);
      card.querySelector(".project-card__year").textContent = project.year;
      card.querySelector(".project-card__title").textContent = project.title;
      card.querySelector(".project-card__type").textContent = project.type;
      card.addEventListener("click", () => {
        if (!state.moved) openPanel("project", project);
      });
      layer.append(card);
    });

    document.querySelector(".archive__counter").textContent =
      `${String(projects.length).padStart(2, "0")} PROJECTS`;
    drawConnections();
  }

  function drawConnections() {
    const svg = document.querySelector(".connections");
    const width = 2100;
    const height = 1300;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.innerHTML = "";

    projects.forEach((project, index) => {
      const next = projects[index + 1];
      if (!next) return;
      const x1 = (project.position.x / 100) * width;
      const y1 = (project.position.y / 100) * height;
      const x2 = (next.position.x / 100) * width;
      const y2 = (next.position.y / 100) * height;
      const bend = Math.max(80, Math.abs(x2 - x1) * 0.25);
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`);
      svg.append(path);
    });
  }

  function setProfile() {
    document.querySelector("#profile-intro").textContent = profile.intro;
    document.querySelector("#current-year").textContent = new Date().getFullYear();
    document.querySelector(".identity__status").lastChild.textContent =
      ` ${profile.availability.replace("Available for ", "")}`;
  }

  const socialMarkup = () =>
    profile.socials
      .filter((social) => social.url)
      .map(
        (social) =>
          `<li><a href="${escapeHtml(social.url)}" target="_blank" rel="noreferrer">${escapeHtml(social.label)} <span aria-hidden="true">↗</span></a></li>`,
      )
      .join("");

  function aboutMarkup() {
    return `
      <p class="panel-label">01 / ABOUT</p>
      <h2 id="panel-title">Hello, I’m<br>${escapeHtml(profile.name)}.</h2>
      <p class="panel-copy">${escapeHtml(profile.about)}</p>
      <div class="panel-grid">
        <div>
          <h3>Capabilities</h3>
          <ul class="clean-list">
            ${profile.capabilities.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </div>
        <div>
          <h3>Elsewhere</h3>
          <ul class="clean-list social-list">${socialMarkup()}</ul>
        </div>
      </div>`;
  }

  function resumeMarkup() {
    const resumeAction = profile.resumeUrl
      ? `<a class="project-link" href="${escapeHtml(profile.resumeUrl)}" target="_blank" rel="noreferrer">Download PDF <span aria-hidden="true">↗</span></a>`
      : `<span class="project-link is-disabled">PDF résumé will be added soon</span>`;

    return `
      <p class="panel-label">02 / RÉSUMÉ</p>
      <h2 id="panel-title">Selected<br>experience.</h2>
      <p class="panel-copy">${escapeHtml(profile.role)} · ${escapeHtml(profile.location)}</p>
      <div class="resume-list">
        <h3>Experience</h3>
        ${profile.experience
          .map(
            (item) => `
              <div class="resume-item">
                <time>${escapeHtml(item.period)}</time>
                <div><strong>${escapeHtml(item.company)}</strong><span>${escapeHtml(item.position)}</span></div>
              </div>`,
          )
          .join("")}
      </div>
      ${resumeAction}`;
  }

  function contactMarkup() {
    const contactAction = profile.email
      ? `<a class="contact-link" href="mailto:${escapeHtml(profile.email)}">${escapeHtml(profile.email)} <span aria-hidden="true">↗</span></a>`
      : `<span class="contact-link is-disabled">Contact details coming soon</span>`;

    return `
      <p class="panel-label">03 / CONTACT</p>
      <h2 id="panel-title">Have an idea?<br>Let’s shape it.</h2>
      <p class="panel-copy">새로운 프로젝트, 협업, 또는 가벼운 인사도 좋습니다. 아래 이메일로 이야기를 들려주세요.</p>
      ${contactAction}
      <p class="contact-note">CURRENTLY IN ${escapeHtml(profile.location.toUpperCase())}<br>${escapeHtml(profile.availability.toUpperCase())}</p>`;
  }

  function projectMarkup(project) {
    const wrapper = document.createElement("div");
    const hero = document.createElement("div");
    hero.className = "project-hero";
    hero.append(makeArt(project, false));
    wrapper.append(hero);

    const copy = document.createElement("div");
    copy.innerHTML = `
      <p class="panel-label">PROJECT ${String(project.index + 1).padStart(2, "0")} / ${escapeHtml(project.year)}</p>
      <h2 id="panel-title">${escapeHtml(project.title)}</h2>
      <p class="panel-copy">${escapeHtml(project.summary)}</p>
      <div class="project-tags">
        ${project.services.map((service) => `<span>${escapeHtml(service)}</span>`).join("")}
      </div>
      ${
        project.link
          ? `<a class="project-link" href="${escapeHtml(project.link)}" target="_blank" rel="noreferrer">Visit project <span aria-hidden="true">↗</span></a>`
          : `<span class="project-link is-disabled">Case study coming soon</span>`
      }`;
    wrapper.append(copy);
    return wrapper;
  }

  function openPanel(type, payload) {
    state.lastFocus = document.activeElement;
    state.activePanel = type;
    panelLabel.textContent = type === "project" ? "SELECTED PROJECT" : "ARCHIVE NOTE";
    panelContent.innerHTML = "";

    if (type === "project") panelContent.append(projectMarkup(payload));
    if (type === "about") panelContent.innerHTML = aboutMarkup();
    if (type === "resume") panelContent.innerHTML = resumeMarkup();
    if (type === "contact") panelContent.innerHTML = contactMarkup();

    panelShell.hidden = false;
    document.body.classList.add("is-panel-open");
    requestAnimationFrame(() => panelShell.querySelector(".panel__close").focus());
  }

  function closePanel() {
    if (panelShell.hidden) return;
    panelShell.hidden = true;
    document.body.classList.remove("is-panel-open");
    state.activePanel = null;
    state.lastFocus?.focus();
  }

  function clampPan() {
    const maxX = Math.max(300, (2100 - window.innerWidth) / 2 + 160);
    const maxY = Math.max(220, (1300 - window.innerHeight) / 2 + 120);
    state.targetX = Math.max(-maxX, Math.min(maxX, state.targetX));
    state.targetY = Math.max(-maxY, Math.min(maxY, state.targetY));
  }

  function animateWorld() {
    if (!mobileQuery.matches) {
      state.x += (state.targetX - state.x) * 0.12;
      state.y += (state.targetY - state.y) * 0.12;
      world.style.setProperty("--pan-x", `${state.x}px`);
      world.style.setProperty("--pan-y", `${state.y}px`);
    }
    requestAnimationFrame(animateWorld);
  }

  function onPointerDown(event) {
    if (mobileQuery.matches || event.button !== 0 || event.target.closest(".project-card")) return;
    state.dragging = true;
    state.moved = false;
    state.startX = event.clientX;
    state.startY = event.clientY;
    state.originX = state.targetX;
    state.originY = state.targetY;
    viewport.classList.add("is-dragging");
    viewport.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event) {
    glow.style.left = `${event.clientX}px`;
    glow.style.top = `${event.clientY}px`;
    if (!state.dragging) return;
    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    if (Math.abs(dx) + Math.abs(dy) > 5) state.moved = true;
    state.targetX = state.originX + dx;
    state.targetY = state.originY + dy;
    clampPan();
    document.body.classList.add("has-moved");
  }

  function onPointerUp(event) {
    if (!state.dragging) return;
    state.dragging = false;
    viewport.classList.remove("is-dragging");
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    setTimeout(() => { state.moved = false; }, 0);
  }

  function onWheel(event) {
    if (mobileQuery.matches || state.activePanel) return;
    event.preventDefault();
    state.targetX -= event.deltaX * 0.7;
    state.targetY -= (event.deltaY + (event.shiftKey ? event.deltaX : 0)) * 0.7;
    clampPan();
    document.body.classList.add("has-moved");
  }

  function resetView() {
    state.targetX = 0;
    state.targetY = 0;
    document.body.classList.remove("has-moved");
  }

  function trapPanelFocus(event) {
    if (event.key !== "Tab" || panelShell.hidden) return;
    const focusable = [...panelShell.querySelectorAll("button, a[href]")].filter(
      (element) => !element.hasAttribute("disabled"),
    );
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function bindEvents() {
    document.querySelectorAll("[data-open-panel]").forEach((button) => {
      button.addEventListener("click", () => openPanel(button.dataset.openPanel));
    });
    document.querySelectorAll("[data-close-panel]").forEach((button) => {
      button.addEventListener("click", closePanel);
    });
    document.querySelector("#reset-view").addEventListener("click", resetView);
    viewport.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    viewport.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", clampPan);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closePanel();
      trapPanelFocus(event);
    });
  }

  function finishBoot() {
    const boot = document.querySelector(".boot");
    window.setTimeout(() => boot.classList.add("is-finished"), 650);
  }

  setProfile();
  renderProjects();
  bindEvents();
  clampPan();
  animateWorld();
  finishBoot();
})();
