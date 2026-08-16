(function () {
  'use strict';

  const LINKTREE_URL = 'https://linktr.ee/PurpleXPurple';
  const PROXY_URL = 'https://api.allorigins.win/raw?url=';

  const bioEl = document.getElementById('bio-text');
  const contactEl = document.getElementById('contact-text');
  const container = document.getElementById('link-container');

  // ── fallback data (creative recovery) ──
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

  // ── render link cards ──
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

  // ── main fetch with retry + fallback ──
  async function fetchLinks(retriesLeft = 1) {
    try {
      const resp = await fetch(PROXY_URL + encodeURIComponent(LINKTREE_URL));
      if (!resp.ok) throw new Error(`HTTP ${resp.status} – ${resp.statusText}`);

      const html = await resp.text();
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

      // If we previously showed a backup notice, remove it
      const oldNotice = document.getElementById('backup-notice');
      if (oldNotice) oldNotice.remove();
    } catch (err) {
      console.warn(`Fetch attempt failed (${retriesLeft} retries left):`, err.message);

      if (retriesLeft > 0) {
        // Wait 1.5 seconds then retry – often fixes transient proxy issues
        await new Promise((r) => setTimeout(r, 1500));
        return fetchLinks(retriesLeft - 1);
      }

      // ── CREATIVE RECOVERY: use static fallback ──
      console.info('Using fallback static data – proxy may be down.');
      bioEl.textContent = FALLBACK_BIO;
      render(FALLBACK_LINKS);
      contactEl.innerHTML = `📧 <a href="mailto:${FALLBACK_CONTACT}" style="color:#a78bfa;">${FALLBACK_CONTACT}</a>`;

      // Graceful UI notice (not a scary error)
      let notice = document.getElementById('backup-notice');
      if (!notice) {
        notice = document.createElement('p');
        notice.id = 'backup-notice';
        notice.style.fontSize = '0.8rem';
        notice.style.opacity = '0.5';
        notice.style.marginTop = '1rem';
        notice.textContent = '⚡ Loaded from static backup – refresh to try live data.';
        document.getElementById('links').appendChild(notice);
      }
    }
  }

  // Start the process
  fetchLinks();
})();
