/*
 * Aturan daftar proyek: bentuk datanya, pencarian, kategori, dan cara
 * sebuah repo GitHub menjadi satu proyek.
 *
 * Sengaja tanpa Firebase dan tanpa DOM, supaya bisa diuji di tests.html
 * tanpa internet dan tanpa login.
 */

export const STATUSES = {
    selesai: 'Selesai',
    berjalan: 'Berjalan',
};

/*
 * Ejaan lain untuk kategori yang sama. Tanpa ini "Go" dari GitHub dan
 * "golang" yang diketik tangan jadi dua kategori di sidebar.
 */
const ALIASES = {
    go: 'golang',
    'next.js': 'next js',
    nextjs: 'next js',
    'google sheets': 'sheet',
    'google sheet': 'sheet',
    spreadsheet: 'sheet',
    sheets: 'sheet',
    js: 'javascript',
    ts: 'typescript',
};

/** "  Next.JS " → "next js" */
export function normalizeCategory(value) {
    const text = String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

    return ALIASES[text] ?? text;
}

/** "sheet, Golang,, next js" → ['sheet', 'golang', 'next js'] */
export function parseCategories(value) {
    const parts = Array.isArray(value) ? value : String(value ?? '').split(',');

    return unique(parts.map(normalizeCategory).filter(Boolean));
}

function unique(items) {
    return [...new Set(items)];
}

/**
 * Hanya tautan http(s) yang dipakai. "javascript:…" yang diketik ke kolom
 * tautan tidak boleh menjadi tautan yang bisa diklik pengunjung.
 */
export function safeUrl(value) {
    const text = String(value ?? '').trim();

    if (!text) {
        return '';
    }

    const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`;

    try {
        const url = new URL(withScheme);

        return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
    } catch {
        return '';
    }
}

/**
 * Satu proyek dalam bentuk yang disimpan. Dipakai formulir admin dan impor
 * GitHub, jadi keduanya tidak bisa menyimpan bentuk yang berbeda.
 */
export function normalizeProject(input) {
    const year = Number.parseInt(input.year, 10);

    return {
        name: String(input.name ?? '').trim().slice(0, 120),
        categories: parseCategories(input.categories).slice(0, 10),
        description: String(input.description ?? '').trim().slice(0, 2000),
        github: safeUrl(input.github),
        demo: safeUrl(input.demo),
        year: Number.isInteger(year) && year >= 1990 && year <= 2100 ? year : null,
        status: Object.hasOwn(STATUSES, input.status) ? input.status : 'selesai',
    };
}

/** Pesan kesalahan formulir, atau null kalau sudah benar. */
export function validateProject(project) {
    if (!project.name) {
        return 'Nama proyek wajib diisi.';
    }

    return null;
}

/** Terbaru dulu; proyek tanpa tahun di bawah; lalu urut nama. */
export function sortProjects(projects) {
    return [...projects].sort((a, b) => (b.year ?? 0) - (a.year ?? 0)
        || String(a.name).localeCompare(String(b.name), 'id', { sensitivity: 'base' }));
}

/**
 * Kategori untuk sidebar, dengan jumlah proyeknya. Urut dari yang paling
 * banyak, lalu abjad.
 *
 * @returns {Array<{name: string, count: number}>}
 */
export function categoryCounts(projects) {
    const counts = new Map();

    for (const project of projects) {
        for (const category of project.categories ?? []) {
            counts.set(category, (counts.get(category) ?? 0) + 1);
        }
    }

    return [...counts]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/**
 * Pencarian: setiap kata harus ditemukan di nama, deskripsi, kategori,
 * tahun, atau status — "golang api" menemukan proyek golang yang
 * deskripsinya menyebut API.
 */
export function filterProjects(projects, { category = '', query = '' } = {}) {
    const words = String(query).toLowerCase().split(/\s+/).filter(Boolean);

    return projects.filter((project) => {
        if (category && !(project.categories ?? []).includes(category)) {
            return false;
        }

        if (!words.length) {
            return true;
        }

        const haystack = [
            project.name,
            project.description,
            ...(project.categories ?? []),
            project.year,
            STATUSES[project.status],
        ].join(' ').toLowerCase();

        return words.every((word) => haystack.includes(word));
    });
}

/**
 * Satu repo GitHub (dari api.github.com) menjadi satu proyek.
 *
 * Kategorinya dari bahasa utama dan topik repo; tautan demo dari kolom
 * "Website" repo, atau alamat GitHub Pages-nya kalau Pages aktif.
 */
export function fromGithubRepo(repo, user) {
    const pages = repo.has_pages ? `https://${user.toLowerCase()}.github.io/${repo.name}/` : '';

    return normalizeProject({
        name: repo.name,
        categories: [repo.language, ...(repo.topics ?? [])].filter(Boolean),
        description: repo.description ?? '',
        github: repo.html_url,
        demo: repo.homepage || pages,
        year: repo.created_at ? new Date(repo.created_at).getFullYear() : null,
        status: 'selesai',
    });
}

/** Alamat repo yang sudah ada di daftar, untuk menandai repo yang sudah diambil. */
export function knownRepos(projects) {
    return new Set(projects.map((p) => repoKey(p.github)).filter(Boolean));
}

export function repoKey(url) {
    return String(url ?? '').trim().toLowerCase().replace(/\/+$/, '').replace(/^http:/, 'https:');
}
