/*
 * Bagian tampilan yang dipakai halaman umum dan halaman admin.
 *
 * Semua teks dari basis data masuk lewat textContent, tidak pernah lewat
 * innerHTML: nama atau deskripsi proyek yang berisi "<script>" tampil
 * sebagai tulisan, bukan dijalankan.
 */

import { STATUSES, safeUrl } from './portfolio.js';

/** h('a', { href, class: 'x' }, 'teks', anak) */
export function h(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);

    for (const [key, value] of Object.entries(attrs)) {
        if (value === null || value === undefined || value === false) {
            continue;
        }

        if (key.startsWith('on') && typeof value === 'function') {
            el.addEventListener(key.slice(2).toLowerCase(), value);
        } else if (key === 'class') {
            el.className = value;
        } else {
            el.setAttribute(key, value === true ? '' : String(value));
        }
    }

    el.append(...children.flat().filter((c) => c !== null && c !== undefined && c !== false));

    return el;
}

/**
 * Warna tetap untuk satu kategori (1–8): "golang" selalu berwarna sama di
 * sidebar dan di setiap proyek, tanpa perlu diatur satu per satu.
 */
export function toneOf(name) {
    let hash = 0;

    for (const char of String(name)) {
        hash = (hash * 31 + char.codePointAt(0)) >>> 0;
    }

    return (hash % 8) + 1;
}

export function categoryTags(categories) {
    return h('span', { class: 'tags' }, (categories ?? []).map((c) => h('span', { class: 'tag', 'data-tone': toneOf(c) }, c)));
}

export function statusBadge(status) {
    return h('span', { class: `status status--${status}` }, STATUSES[status] ?? status);
}

/** Rincian satu proyek: deskripsi, kategori, tahun, status, dan tautannya. */
export function projectDetail(project) {
    const github = safeUrl(project.github);
    const demo = safeUrl(project.demo);

    return h('div', { class: 'detail' },
        project.description
            ? h('p', { class: 'detail__text' }, project.description)
            : h('p', { class: 'detail__text muted' }, 'Belum ada deskripsi.'),

        h('dl', { class: 'detail__meta' },
            h('dt', {}, 'Kategori'), h('dd', {}, project.categories?.length ? categoryTags(project.categories) : '—'),
            h('dt', {}, 'Tahun'), h('dd', {}, project.year ?? '—'),
            h('dt', {}, 'Status'), h('dd', {}, statusBadge(project.status)),
        ),

        (github || demo) && h('div', { class: 'detail__links' },
            demo && h('a', { class: 'button button--primary', href: demo, target: '_blank', rel: 'noopener' }, 'Preview ↗'),
            github && h('a', { class: 'button', href: github, target: '_blank', rel: 'noopener' },
                new URL(github).hostname.endsWith('github.com') ? 'Kode di GitHub ↗' : 'Buka link ↗'),
        ),
    );
}

/** Pesan singkat di pojok bawah. */
export function toast(message, kind = 'info') {
    const el = h('div', { class: `toast toast--${kind}`, role: 'status' }, message);

    document.body.append(el);
    setTimeout(() => el.remove(), 3500);
}

export function setupNotice(target) {
    target.replaceChildren(h('div', { class: 'notice' },
        h('strong', {}, 'Firebase belum diatur. '),
        'Isi firebaseConfig di assets/js/config.js — langkahnya ada di README.md.',
    ));
}
