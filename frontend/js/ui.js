/**
 * Utilidades de la UI compartidas por las cuatro páginas del scaffold.
 */

/** Marca el enlace activo del menú principal según la página actual. */
export function markActiveNav(doc = document, page = detectPage()) {
  const links = doc.querySelectorAll('[data-nav]');
  let found = false;
  links.forEach((link) => {
    const active = link.getAttribute('data-nav') === page;
    link.classList.toggle('is-active', active);
    if (active) {
      link.setAttribute('aria-current', 'page');
      found = true;
    } else {
      link.removeAttribute('aria-current');
    }
  });
  return found;
}

/** Detecta la página a partir del nombre del fichero (`channels.html` → `channels`). */
export function detectPage(pathname = typeof location !== 'undefined' ? location.pathname : '/') {
  const file = String(pathname).split('/').pop() || 'index.html';
  const page = file.replace(/\.html?$/i, '');
  return page === '' || page === 'index' ? 'login' : page;
}

/** `true` si el elemento debe ocultarse (display: none) — helper usado por listas. */
export function setHidden(element, hidden) {
  if (element) element.hidden = Boolean(hidden);
}

/** Crea una tarjeta de canal como elemento DOM (sin innerHTML con datos externos). */
export function createChannelCard(channel, { onSelect, selectedId } = {}, doc = document) {
  const article = doc.createElement('article');
  article.className = 'channel-card';
  article.dataset.channelId = channel.id;
  if (selectedId && channel.id === selectedId) article.classList.add('is-selected');

  const badge = doc.createElement('span');
  badge.className = 'channel-badge';
  badge.textContent = channel.countryLabel || channel.country || '—';

  const title = doc.createElement('h3');
  title.className = 'channel-name';
  title.textContent = channel.name;

  const meta = doc.createElement('p');
  meta.className = 'channel-meta';
  meta.textContent = channel.categories.join(' · ') || 'Sin categoría';

  const actions = doc.createElement('div');
  actions.className = 'channel-actions';

  const play = doc.createElement('button');
  play.type = 'button';
  play.className = 'btn btn-primary';
  play.textContent = 'Reproducir';
  play.addEventListener('click', () => onSelect && onSelect(channel));

  const fav = doc.createElement('button');
  fav.type = 'button';
  fav.className = 'btn btn-ghost';
  fav.textContent = channel.isFavorite ? '★ Favorito' : '☆ Añadir a favoritos';
  fav.disabled = true;
  fav.title = 'Los favoritos reales llegarán con la integración de la API (TVH-30).';

  actions.append(play, fav);
  article.append(badge, title, meta, actions);
  return article;
}

/** Rellena un `<select>` con opciones `{ value, label }`. */
export function fillSelect(select, options, { placeholder = 'Todos', doc = document } = {}) {
  if (!select) return;
  select.replaceChildren();
  const first = doc.createElement('option');
  first.value = '';
  first.textContent = placeholder;
  select.append(first);
  for (const option of options) {
    const el = doc.createElement('option');
    el.value = option.value;
    el.textContent = option.label;
    select.append(el);
  }
}

/** Muestra un aviso accesible y devuelve el elemento. */
export function showNotice(container, message, { variant = 'info', doc = document } = {}) {
  if (!container) return null;
  const notice = doc.createElement('p');
  notice.className = `notice notice-${variant}`;
  notice.setAttribute('role', variant === 'error' ? 'alert' : 'status');
  notice.textContent = message;
  container.replaceChildren(notice);
  return notice;
}

export function formatDateTime(iso, locale = 'es-MX') {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
