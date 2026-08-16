(function() {
    'use strict';

    const LINKTREE_URL = 'https://linktr.ee/PurpleXPurple';
    const PROXY_URL = 'https://api.allorigins.win/raw?url=';

    const bioEl = document.getElementById('bio-text');
    const contactEl = document.getElementById('contact-text');
    const container = document.getElementById('link-container');

    // ── get favicon from Google ──
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
        container.innerHTML = links.map(link => `
            <a href="${link.url}" target="_blank" rel="noopener" class="link-card">
                <img src="${favicon(link.url)}" alt="${link.label}" class="link-icon" loading="lazy" />
                <span class="link-label">${link.label}</span>
            </a>
        `).join('');
    }

    // ── extract bio from JSON‑LD or meta ──
    function getBio(html) {
        // Try JSON‑LD first
        const ldMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
        if (ldMatch) {
            try {
                const data = JSON.parse(ldMatch[1]);
                const person = data.mainEntity || data;
                if (person.description) return person.description;
            } catch {}
        }
        // Fallback to meta description
        const metaMatch = html.match(/<meta name="description" content="([^"]*)"/i);
        if (metaMatch) return metaMatch[1];
        // Fallback to title
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        if (titleMatch) return titleMatch[1];
        return 'PurpleXPurple';
    }

    // ── extract all external links from the page ──
    function extractLinks(html) {
        const links = [];
        const seen = new Set();

        // Find all <a> tags
        const anchorRegex = /<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi;
        let match;
        while ((match = anchorRegex.exec(html)) !== null) {
            const url = match[1].trim();
            const rawLabel = match[2].replace(/<[^>]*>/g, '').trim() || '';

            // Skip internal, empty, or linktr.ee links
            if (!url || url.startsWith('#') || url.startsWith('javascript:') || 
                url.includes('linktr.ee') || url.startsWith('/')) continue;

            // Normalize URL
            let fullUrl = url;
            if (url.startsWith('//')) fullUrl = 'https:' + url;
            else if (!url.startsWith('http')) fullUrl = 'https://' + url;

            // Skip duplicates
            if (seen.has(fullUrl)) continue;
            seen.add(fullUrl);

            // Generate a clean label
            let label = rawLabel;
            if (!label) {
                try {
                    const domain = new URL(fullUrl).hostname.replace('www.', '');
                    label = domain.split('.')[0];
                } catch {
                    label = fullUrl;
                }
            }
            // Capitalize first letter of each word for better readability
            label = label.replace(/\b\w/g, c => c.toUpperCase());

            links.push({ label, url: fullUrl });
        }

        return links;
    }

    // ── find WhatsApp link specifically ──
    function getWhatsApp(links) {
        return links.find(l => l.url.includes('whatsapp') || l.url.includes('wa.me'));
    }

    // ── main ──
    async function fetchLinks() {
        try {
            const resp = await fetch(PROXY_URL + encodeURIComponent(LINKTREE_URL));
            if (!resp.ok) throw new Error('Network error');
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

        } catch (err) {
            console.warn('Failed to load:', err);
            bioEl.textContent = 'PurpleXPurple';
            contactEl.textContent = 'Could not load contact info.';
            container.innerHTML = '<p>Failed to load links. Please refresh.</p>';
        }
    }

    fetchLinks();
})();