function setActiveNav() {
  const current = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === current || (current === "" && href === "index.html")) {
      link.classList.add("active");
    }
  });
}

function courseCard(course) {
  return `
    <article class="card">
      <span class="tag">${course.livello}</span>
      <h3>${course.titolo}</h3>
      <p>${course.descrizione}</p>
      <p class="meta">Durata: <strong>${course.durata}</strong></p>
      <p class="meta">Formato: ${course.formato}</p>
      <p class="meta">Coach: ${course.coach}</p>
      <div class="card-actions">
        <a class="btn" href="corso.html?id=${course.id}">Dettagli corso</a>
      </div>
    </article>
  `;
}

function renderCourses(targetId, limit) {
  const target = document.getElementById(targetId);
  if (!target) return;
  const courses = getCourses();
  const list = limit ? courses.slice(0, limit) : courses;
  target.innerHTML = list.map(courseCard).join("");
}

function renderMasters() {
  const target = document.getElementById("masters-grid");
  if (!target) return;
  target.innerHTML = masters
    .map(
      (m) => `
      <article class="card">
        <h3>${m.nome}</h3>
        <p class="meta"><strong>${m.ruolo}</strong></p>
        <p>${m.bio}</p>
        <p class="meta">Specialità: ${m.specialita}</p>
      </article>
    `
    )
    .join("");
}

function renderEvents(targetId, limit) {
  const target = document.getElementById(targetId);
  if (!target) return;
  const list = limit ? liveEvents.slice(0, limit) : liveEvents;
  target.innerHTML = list
    .map(
      (event) => `
      <article class="card">
        <span class="tag">Evento Live</span>
        <h3>${event.titolo}</h3>
        <p class="meta">${toItDate(event.data)} • ${event.luogo}</p>
        <p>${event.dettagli}</p>
      </article>
    `
    )
    .join("");
}

function renderCourseDetail() {
  const wrapper = document.getElementById("course-detail");
  if (!wrapper) return;
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const course = id ? getCourseById(id) : null;
  if (!course) {
    wrapper.innerHTML = `<div class="card"><h2>Corso non trovato</h2><p>Seleziona un corso dalla pagina corsi.</p><a class="btn" href="corsi.html">Vai ai corsi</a></div>`;
    return;
  }

  const calendarBlock = course.calendario.length
    ? `<div class="card"><h3>Calendario disponibile</h3><ul class="list-clean">${course.calendario
        .map((slot) => `<li>${slot}</li>`)
        .join("")}</ul></div>`
    : `<div class="card"><h3>Calendario in arrivo</h3><p>Per questo corso il calendario sarà pubblicato a breve. Compila il modulo per essere avvisato.</p></div>`;

  wrapper.innerHTML = `
    <div class="grid grid-3">
      <article class="card">
        <span class="tag">${course.livello}</span>
        <h2>${course.titolo}</h2>
        <p>${course.descrizione}</p>
        <p class="meta">Durata: <strong>${course.durata}</strong></p>
        <p class="meta">Formato: ${course.formato}</p>
        <p class="meta">Coach: ${course.coach}</p>
      </article>
      ${calendarBlock}
      <article class="card">
        <h3>Richiedi informazioni</h3>
        <form id="course-info-form" class="form-grid">
          <input name="nome" placeholder="Nome e Cognome" required />
          <input name="email" type="email" placeholder="Email" required />
          <textarea name="messaggio" placeholder="Scrivi la tua domanda" required></textarea>
          <button class="btn" type="submit">Invia richiesta</button>
        </form>
        <div id="course-form-feedback"></div>
      </article>
    </div>
  `;

  const form = document.getElementById("course-info-form");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    document.getElementById("course-form-feedback").innerHTML =
      '<p class="notice success">Richiesta inviata! Ti contatteremo presto.</p>';
    form.reset();
  });
}

function renderCalendarTable() {
  const body = document.getElementById("calendar-body");
  if (!body) return;

  const rows = [];
  getCourses().forEach((course) => {
    if (course.calendario.length) {
      course.calendario.forEach((slot) => {
        rows.push(`<tr><td>${course.titolo}</td><td>${slot}</td><td>${course.coach}</td></tr>`);
      });
    } else {
      rows.push(`<tr><td>${course.titolo}</td><td>Da definire</td><td>${course.coach}</td></tr>`);
    }
  });

  liveEvents.forEach((event) => {
    rows.push(`<tr><td>${event.titolo}</td><td>${toItDate(event.data)}</td><td>${event.luogo}</td></tr>`);
  });

  body.innerHTML = rows.join("");
}

function setupCourseManagement() {
  const form = document.getElementById("course-management-form");
  const tableBody = document.getElementById("course-management-body");
  if (!form || !tableBody) return;

  const paintTable = () => {
    const courses = getCourses();
    tableBody.innerHTML = courses
      .map(
        (course) => `
        <tr>
          <td>${course.titolo}</td>
          <td>${course.livello}</td>
          <td>${course.durata}</td>
          <td>${course.calendario.length ? "Disponibile" : "Non disponibile"}</td>
        </tr>
      `
      )
      .join("");
  };

  paintTable();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const calendarRaw = data.get("calendario").toString().trim();
    const newCourse = {
      id: data.get("titolo").toString().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      titolo: data.get("titolo").toString(),
      livello: data.get("livello").toString(),
      durata: data.get("durata").toString(),
      formato: data.get("formato").toString(),
      descrizione: data.get("descrizione").toString(),
      coach: data.get("coach").toString(),
      calendario: calendarRaw ? calendarRaw.split("|").map((s) => s.trim()).filter(Boolean) : []
    };

    const courses = getCourses();
    courses.push(newCourse);
    saveCourses(courses);
    paintTable();

    document.getElementById("management-feedback").innerHTML =
      '<p class="notice success">Corso aggiunto correttamente. Lo trovi anche nella pagina corsi.</p>';
    form.reset();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setActiveNav();
  renderCourses("courses-grid-home", 3);
  renderCourses("courses-grid");
  renderMasters();
  renderEvents("events-grid-home", 2);
  renderEvents("events-grid");
  renderCourseDetail();
  renderCalendarTable();
  setupCourseManagement();
});
