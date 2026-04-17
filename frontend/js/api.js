const API_BASE = window.localStorage.getItem('specialacademy_api') || 'http://localhost:4000/api';

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('specialacademy_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Errore generico' }));
    throw new Error(error.error || 'Richiesta fallita');
  }

  if (res.status === 204) return null;
  return res.json();
}

function setActiveNav() {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach((link) => {
    if (link.getAttribute('href') === current) link.classList.add('active');
  });
}

function notify(targetId, message, type = 'ok') {
  const el = document.getElementById(targetId);
  if (!el) return;
  el.innerHTML = `<p style="padding:10px;border-radius:12px;background:${type === 'ok' ? '#e7f9f9' : '#ffecec'};color:${type === 'ok' ? '#055353' : '#8a1f1f'};">${message}</p>`;
}

function cardCourse(c) {
  return `
    <article class="card">
      <img src="${c.image}" alt="${c.title}" loading="lazy" />
      <div class="card-content">
        <span class="tag">${c.level}</span>
        <h3>${c.title}</h3>
        <p>${c.description}</p>
        <p><strong>${c.duration}</strong> • ${c.format}</p>
        <a class="btn" href="corso.html?id=${c.id}">Dettagli</a>
      </div>
    </article>
  `;
}

window.SpecialAcademy = { apiFetch, setActiveNav, notify, cardCourse };
