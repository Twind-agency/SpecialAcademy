const { apiFetch, setActiveNav, notify, cardCourse } = window.SpecialAcademy;

async function renderHome() {
  const coursesEl = document.getElementById('home-courses');
  const mastersEl = document.getElementById('home-masters');
  const eventsEl = document.getElementById('home-events');

  if (!coursesEl && !mastersEl && !eventsEl) return;

  const [courses, masters, events] = await Promise.all([
    apiFetch('/public/courses'),
    apiFetch('/public/masters'),
    apiFetch('/public/events')
  ]);

  if (coursesEl) coursesEl.innerHTML = courses.slice(0, 3).map(cardCourse).join('');
  if (mastersEl) {
    mastersEl.innerHTML = masters
      .map((m) => `
        <article class="card">
          <img src="${m.photo}" alt="${m.name}" loading="lazy" />
          <div class="card-content">
            <h3>${m.name}</h3>
            <p><strong>${m.role}</strong></p>
            <p>${m.bio}</p>
            <a class="btn btn-secondary" href="maestri.html#${m.id}">Vai alla scheda completa</a>
          </div>
        </article>
      `)
      .join('');
  }

  if (eventsEl) {
    eventsEl.innerHTML = events
      .map((e) => `
        <article class="card">
          <img src="${e.image}" alt="${e.title}" loading="lazy" />
          <div class="card-content">
            <span class="tag">Live</span>
            <h3>${e.title}</h3>
            <p><strong>${new Date(e.date).toLocaleDateString('it-IT')}</strong> • ${e.location}</p>
            <p>${e.description}</p>
          </div>
        </article>
      `)
      .join('');
  }
}

async function renderCoursesPage() {
  const el = document.getElementById('courses-grid');
  if (!el) return;
  const courses = await apiFetch('/public/courses');
  el.innerHTML = courses.map(cardCourse).join('');
}

async function renderCourseDetail() {
  const wrapper = document.getElementById('course-detail');
  if (!wrapper) return;

  const id = new URLSearchParams(window.location.search).get('id');
  const courses = await apiFetch('/public/courses');
  const c = courses.find((item) => item.id === id);

  if (!c) {
    wrapper.innerHTML = '<div class="tile"><h2>Corso non trovato</h2></div>';
    return;
  }

  wrapper.innerHTML = `
    <div class="cards-3">
      <article class="card">
        <img src="${c.image}" alt="${c.title}" loading="lazy" />
        <div class="card-content">
          <span class="tag">${c.level}</span>
          <h2>${c.title}</h2>
          <p>${c.description}</p>
          <p><strong>${c.duration}</strong> • ${c.format}</p>
        </div>
      </article>
      <article class="tile">
        <h3>Calendario corso</h3>
        ${c.calendarSlots?.length ? `<ul>${c.calendarSlots.map((s) => `<li>${s}</li>`).join('')}</ul>` : '<p>Calendario non ancora disponibile.</p>'}
      </article>
      <article class="tile">
        <h3>Richiedi informazioni</h3>
        <form id="contact-form" class="form-grid">
          <input name="name" placeholder="Nome e cognome" required />
          <input name="email" type="email" placeholder="Email" required />
          <input name="phone" placeholder="Telefono" />
          <select name="category">
            <option value="informazioni-corso">Informazioni corso</option>
            <option value="supporto">Supporto</option>
            <option value="generica">Generica</option>
          </select>
          <textarea name="message" placeholder="Messaggio" required></textarea>
          <button class="btn" type="submit">Invia</button>
        </form>
        <div id="contact-feedback"></div>
      </article>
    </div>
  `;

  document.getElementById('contact-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    data.source = `course-${c.id}`;
    await apiFetch('/public/contacts', { method: 'POST', body: JSON.stringify(data) });
    notify('contact-feedback', 'Richiesta inviata con successo.');
    e.currentTarget.reset();
  });
}

async function renderMastersPage() {
  const el = document.getElementById('masters-grid');
  if (!el) return;
  const masters = await apiFetch('/public/masters');
  el.innerHTML = masters
    .map(
      (m) => `<article class="card" id="${m.id}"><img src="${m.photo}" alt="${m.name}" />
      <div class="card-content">
        <h3>${m.name}</h3>
        <p><strong>${m.role}</strong></p>
        <p>${m.bio}</p>
        <p>Bio estesa (demo): docente senior con esperienza in academy, percorsi personalizzati e focus su qualità servizio, benessere animale e gestione cliente.</p>
        <p><strong>Specializzazioni:</strong> razze complesse, protocolli low stress, ottimizzazione tempi in salone.</p>
      </div></article>`
    )
    .join('');
}

async function renderEventsPage() {
  const el = document.getElementById('events-grid');
  if (!el) return;
  const events = await apiFetch('/public/events');
  el.innerHTML = events.map((e) => `<article class="card"><img src="${e.image}" alt="${e.title}" /><div class="card-content"><span class="tag">Evento live</span><h3>${e.title}</h3><p>${new Date(e.date).toLocaleDateString('it-IT')} • ${e.location}</p><p>${e.description}</p></div></article>`).join('');
}

async function renderCalendarPage() {
  const body = document.getElementById('calendar-body');
  if (!body) return;
  const calendar = await apiFetch('/public/calendar');
  body.innerHTML = calendar.map((r) => `<tr><td>${r.type}</td><td>${r.title}</td><td>${new Date(r.date).toLocaleDateString('it-IT')} ${r.time}</td><td>${r.owner}</td></tr>`).join('');
}

setActiveNav();
renderHome();
renderCoursesPage();
renderCourseDetail();
renderMastersPage();
renderEventsPage();
renderCalendarPage();

document.querySelectorAll('.faq-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const parent = btn.closest('.faq-item');
    const isOpen = parent.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach((item) => {
      item.classList.remove('open');
      const sign = item.querySelector('.faq-btn span');
      if (sign) sign.textContent = '+';
    });
    if (!isOpen) {
      parent.classList.add('open');
      const currentSign = btn.querySelector('span');
      if (currentSign) currentSign.textContent = '−';
    }
  });
});
