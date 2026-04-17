const { apiFetch, notify } = window.SpecialAcademy;

function currentAdmin() {
  try {
    return JSON.parse(localStorage.getItem('specialacademy_admin') || 'null');
  } catch {
    return null;
  }
}

function hasPerm(permission) {
  const admin = currentAdmin();
  return admin?.permissions?.includes(permission);
}

async function login(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.currentTarget).entries());
  try {
    const result = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(data) });
    localStorage.setItem('specialacademy_token', result.token);
    localStorage.setItem('specialacademy_admin', JSON.stringify(result.admin));
    notify('login-feedback', `Benvenuto ${result.admin.name}`);
    e.currentTarget.reset();
    await renderAdminSections();
  } catch (error) {
    notify('login-feedback', error.message, 'err');
  }
}

function logout() {
  localStorage.removeItem('specialacademy_token');
  localStorage.removeItem('specialacademy_admin');
  location.reload();
}

async function renderTable(resource, tbodyId, columns) {
  const list = await apiFetch(`/${resource}`);
  const tbody = document.getElementById(tbodyId);
  tbody.innerHTML = list
    .map((item) => `<tr>${columns.map((c) => `<td>${Array.isArray(item[c]) ? item[c].join(', ') : (item[c] ?? '')}</td>`).join('')}</tr>`)
    .join('');
}

async function renderAdminSections() {
  const panel = document.getElementById('admin-panel');
  const admin = currentAdmin();
  if (!admin) {
    panel.style.display = 'none';
    return;
  }

  panel.style.display = 'block';
  document.getElementById('whoami').textContent = `${admin.name} (${admin.level})`;

  const loaders = [];
  if (hasPerm('manage_courses')) loaders.push(renderTable('courses', 'table-courses', ['title', 'level', 'duration']));
  if (hasPerm('manage_masters')) loaders.push(renderTable('masters', 'table-masters', ['name', 'role']));
  if (hasPerm('manage_events')) loaders.push(renderTable('events', 'table-events', ['title', 'date', 'location']));
  if (hasPerm('manage_contacts')) loaders.push(renderTable('contacts', 'table-contacts', ['name', 'email', 'category', 'tags', 'status']));
  if (hasPerm('manage_calendar')) loaders.push(renderTable('calendar', 'table-calendar', ['type', 'title', 'date', 'time']));
  if (hasPerm('manage_requests')) loaders.push(renderTable('genericRequests', 'table-requests', ['subject', 'status']));
  if (hasPerm('manage_admins')) loaders.push(renderTable('admins', 'table-admins', ['name', 'email', 'level']));

  if (hasPerm('send_contact_emails')) {
    const list = await apiFetch('/contacts/email-list');
    document.getElementById('email-list').textContent = list.emails.join('; ');
  }

  await Promise.all(loaders);
}

async function quickCreate(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const resource = form.dataset.resource;
  const data = Object.fromEntries(new FormData(form).entries());

  if (resource === 'contacts' && data.tags) {
    data.tags = data.tags.split(',').map((t) => t.trim()).filter(Boolean);
  }

  if (resource === 'admins' && data.permissions) {
    data.permissions = data.permissions.split(',').map((p) => p.trim()).filter(Boolean);
  }

  try {
    await apiFetch(`/${resource}`, { method: 'POST', body: JSON.stringify(data) });
    notify('admin-feedback', `${resource} creato con successo`);
    form.reset();
    await renderAdminSections();
  } catch (error) {
    notify('admin-feedback', error.message, 'err');
  }
}

document.getElementById('login-form')?.addEventListener('submit', login);
document.querySelectorAll('.quick-create').forEach((f) => f.addEventListener('submit', quickCreate));
document.getElementById('logout-btn')?.addEventListener('click', logout);

renderAdminSections();
