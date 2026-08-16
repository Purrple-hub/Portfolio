(function () {
  'use strict';

  const LINKTREE_URL = 'https://linktr.ee/PurpleXPurple';

  // Proxy list – try in order
  const PROXIES = [
    (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  ];

  const bioEl = document.getElementById('bio-text');
  const contactEl = document.getElementById('contact-text');
  const container = document.getElementById('link-container');

  // ── fallback static data ──
  const FALLBACK_LINKS = [
    { label: 'GitHub', url: 'https://github.com/Purrple-hub' },
    { label: 'Twitter / X', url: 'https://x.com/PurpleXPurple' },
  ];
  const FALLBACK_BIO = 'PurpleXPurple – find me everywhere.';
  const FALLBACK_CONTACT = 'purple@example.com';

  // ── favicon helper ──
  function favicon(url) {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return '';
    }
  }

  // ── render ──
  function render(links) {
    if (!links || links.length === 0) {
      container.innerHTML = '<p>No links found.</p>';
      return;
    }
    container.innerHTML = links
      .map(
        (link) => `
          <a href="${link.url}" target="_blank" rel="noopener" class="link-card">
            <img src="${favicon(link.url)}" alt="${link.label}" class="link-icon" loading="lazy" />
            <span class="link-label">${link.label}</span>
          </a>
        `
      )
      .join('');
  }

  // ── extract bio from JSON‑LD or meta ──
  function getBio(html) {
    const ldMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
    if (ldMatch) {
      try {
        const data = JSON.parse(ldMatch[1]);
        const person = data.mainEntity || data;
        if (person.description) return person.description;
      } catch {}
    }
    const metaMatch = html.match(/<meta name="description" content="([^"]*)"/i);
    if (metaMatch) return metaMatch[1];
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    if (titleMatch) return titleMatch[1];
    return FALLBACK_BIO;
  }

  // ── extract external links ──
  function extractLinks(html) {
    const links = [];
    const seen = new Set();
    const anchorRegex = /<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi;
    let match;

    while ((match = anchorRegex.exec(html)) !== null) {
      const url = match[1].trim();
      const rawLabel = match[2].replace(/<[^>]*>/g, '').trim() || '';

      if (
        !url ||
        url.startsWith('#') ||
        url.startsWith('javascript:') ||
        url.includes('linktr.ee') ||
        url.startsWith('/')
      )
        continue;

      let fullUrl = url;
      if (url.startsWith('//')) fullUrl = 'https:' + url;
      else if (!url.startsWith('http')) fullUrl = 'https://' + url;

      if (seen.has(fullUrl)) continue;
      seen.add(fullUrl);

      let label = rawLabel;
      if (!label) {
        try {
          const domain = new URL(fullUrl).hostname.replace('www.', '');
          label = domain.split('.')[0];
        } catch {
          label = fullUrl;
        }
      }
      label = label.replace(/\b\w/g, (c) => c.toUpperCase());
      links.push({ label, url: fullUrl });
    }
    return links;
  }

  function getWhatsApp(links) {
    return links.find((l) => l.url.includes('whatsapp') || l.url.includes('wa.me'));
  }

  // ── fetch with proxy rotation ──
  async function fetchWithProxy(proxyIndex = 0) {
    if (proxyIndex >= PROXIES.length) {
      throw new Error('All proxies failed');
    }

    const proxyUrl = PROXIES[proxyIndex](LINKTREE_URL);
    const resp = await fetch(proxyUrl);

    if (!resp.ok) {
      throw new Error(`Proxy ${proxyIndex} returned ${resp.status}`);
    }

    const data = await resp.json();

    // The 'get' endpoint returns { contents: "..." } – extract that
    let html;
    if (data.contents) {
      html = data.contents;
    } else if (data.response) {
      // corsproxy.io returns { response: "..." }
      html = data.response;
    } else {
      // Fallback – if it's plain text, treat it as HTML
      html = typeof data === 'string' ? data : JSON.stringify(data);
    }

    return html;
  }

  // ── main ──
  async function fetchLinks() {
    try {
      let html;
      try {
        html = await fetchWithProxy(0); // allorigins
      } catch (err) {
        console.warn('First proxy failed, trying backup...', err.message);
        html = await fetchWithProxy(1); // corsproxy.io
      }

      const bio = getBio(html);
      bioEl.textContent = bio;

      const allLinks = extractLinks(html);
      render(allLinks);

      const wa = getWhatsApp(allLinks);
      if (wa) {
        contactEl.innerHTML = `📞 <a href="${wa.url}" target="_blank" style="color:#a78bfa;">${wa.url}</a>`;
      } else {
        contactEl.textContent = 'No contact info found.';
      }

      // Remove any backup notice
      const oldNotice = document.getElementById('backup-notice');
      if (oldNotice) oldNotice.remove();
    } catch (err) {
      console.warn('All proxies failed – using static fallback:', err.message);

      // ── static backup ──
      bioEl.textContent = FALLBACK_BIO;
      render(FALLBACK_LINKS);
      contactEl.innerHTML = `📧 <a href="mailto:${FALLBACK_CONTACT}" style="color:#a78bfa;">${FALLBACK_CONTACT}</a>`;

      let notice = document.getElementById('backup-notice');
      if (!notice) {
        notice = document.createElement('p');
        notice.id = 'backup-notice';
        notice.style.fontSize = '0.8rem';
        notice.style.opacity = '0.5';
        notice.style.marginTop = '1rem';
        notice.textContent = '⚡ Using static backup – refresh to retry live data.';
        document.getElementById('links').appendChild(notice);
      }
    }
  }

  fetchLinks();
})();
