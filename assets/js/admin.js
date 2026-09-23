/*
 * Halaman admin: tambah, ubah, hapus proyek, dan ambil repo dari GitHub.
 *
 * Yang belum login dikembalikan ke halaman depan. Itu hanya soal
 * tampilan — yang benar-benar menolak penulisan dari orang lain adalah
 * firestore.rules.
 */

import { SITE } from './config.js';
import { addProjects, allProjects, deleteProject, errorMessage, isConfigured, saveProject, watchProjects } from './firebase.js';
import { isUnlocked, lock } from './gate.js';
import { categoryCounts, filterProjects, fromGithubRepo, knownRepos, normalizeProject, repoKey, sortProjects, validateProject } from './portfolio.js';
import { categoryTags, h, setupNotice, statusBadge, toast } from './ui.js';

const $ = (id) => document.getElementById(id);

const state = {
    projects: [],
    query: '',
    editingId: null,
    repos: [],
    selected: new Set(),
};

/* --------------------------------------------------------------- daftar */

function renderList() {
    const shown = sortProjects(filterProjects(state.projects, { query: state.query }));

    $('status').textContent = `${state.projects.length} proyek${state.query ? ` · ${shown.length} cocok` : ''}`;

    if (!shown.length) {
        $('list').replaceChildren(h('li', { class: 'empty' },
            state.projects.length ? 'Tidak ada proyek yang cocok.' : 'Belum ada proyek. Tambahkan, atau ambil dari GitHub.'));

        return;
    }

    $('list').replaceChildren(...shown.map((project) => h('li', { class: 'project project--admin' },
        h('div', { class: 'project__row project__row--static' },
            h('span', { class: 'project__name' }, project.name),
            categoryTags(project.categories),
            h('span', { class: 'project__meta' }, project.year ?? '', statusBadge(project.status)),
        ),
        h('div', { class: 'project__actions' },
            h('button', { type: 'button', class: 'button button--small', onclick: () => openEditor(project) }, 'Ubah'),
            h('button', { type: 'button', class: 'button button--small button--danger', onclick: () => remove(project) }, 'Hapus'),
        ),
    )));
}

async function remove(project) {
    if (!confirm(`Hapus "${project.name}"?`)) {
        return;
    }

    try {
        await deleteProject(project.id);
        toast('Proyek dihapus.');
    } catch (error) {
        toast(errorMessage(error), 'error');
    }
}

/* -------------------------------------------------------------- formulir */

function openEditor(project = null) {
    const form = $('editorForm');

    state.editingId = project?.id ?? null;
    $('editorTitle').textContent = project ? 'Ubah proyek' : 'Tambah proyek';
    $('editorError').textContent = '';

    form.reset();
    form.elements.name.value = project?.name ?? '';
    form.elements.categories.value = (project?.categories ?? []).join(', ');
    form.elements.description.value = project?.description ?? '';
    form.elements.github.value = project?.github ?? '';
    form.elements.demo.value = project?.demo ?? '';
    form.elements.year.value = project?.year ?? new Date().getFullYear();
    form.elements.status.value = project?.status ?? 'selesai';

    $('categoryList').replaceChildren(...categoryCounts(state.projects).map((c) => h('option', { value: c.name })));

    $('editor').showModal();
    form.elements.name.focus();
}

async function submitEditor(event) {
    event.preventDefault();

    const project = normalizeProject(Object.fromEntries(new FormData($('editorForm'))));
    const problem = validateProject(project);

    if (problem) {
        $('editorError').textContent = problem;

        return;
    }

    $('editorSave').disabled = true;

    try {
        await saveProject(state.editingId, project);
        $('editor').close();
        toast(state.editingId ? 'Perubahan disimpan.' : 'Proyek ditambahkan.');
    } catch (error) {
        $('editorError').textContent = errorMessage(error);
    } finally {
        $('editorSave').disabled = false;
    }
}

/* ---------------------------------------------------------------- GitHub */

/* Repo publik milik akun itu sendiri, tanpa fork. Tanpa token: GitHub
 * membatasi 60 permintaan per jam, jauh lebih dari cukup untuk ini. */
async function fetchRepos(user) {
    const repos = [];

    for (let page = 1; page <= 5; page++) {
        const response = await fetch(
            `https://api.github.com/users/${encodeURIComponent(user)}/repos?type=owner&sort=updated&per_page=100&page=${page}`,
            { headers: { Accept: 'application/vnd.github+json' } },
        );

        if (!response.ok) {
            throw new Error(response.status === 403
                ? 'Batas permintaan ke GitHub tercapai. Coba lagi sekitar sejam lagi.'
                : `GitHub menjawab ${response.status}.`);
        }

        const batch = await response.json();
        repos.push(...batch);

        if (batch.length < 100) {
            break;
        }
    }

    return repos.filter((repo) => !repo.fork);
}

async function openGithub() {
    state.selected.clear();
    $('repos').replaceChildren();
    $('githubStatus').textContent = 'Memuat repo…';
    updateGithubButton();
    $('github').showModal();

    try {
        state.repos = await fetchRepos(SITE.githubUser);
        renderRepos();
    } catch (error) {
        $('githubStatus').textContent = error.message;
    }
}

function renderRepos() {
    const known = knownRepos(state.projects);
    const fresh = state.repos.filter((repo) => !known.has(repoKey(repo.html_url)));

    $('githubStatus').replaceChildren(
        `${state.repos.length} repo di github.com/${SITE.githubUser}, ${fresh.length} belum ada di daftar. `,
        fresh.length ? h('button', {
            type: 'button',
            class: 'link',
            onclick: () => {
                fresh.forEach((repo) => state.selected.add(repo.html_url));
                renderRepos();
            },
        }, 'Pilih semua yang belum ada') : '',
    );

    $('repos').replaceChildren(...state.repos.map((repo) => {
        const added = known.has(repoKey(repo.html_url));

        return h('li', { class: `repo${added ? ' repo--added' : ''}` },
            h('label', {},
                h('input', {
                    type: 'checkbox',
                    checked: state.selected.has(repo.html_url),
                    disabled: added,
                    onchange: (event) => {
                        event.target.checked ? state.selected.add(repo.html_url) : state.selected.delete(repo.html_url);
                        updateGithubButton();
                    },
                }),
                h('span', { class: 'repo__name' }, repo.name),
                repo.language && h('span', { class: 'tag' }, repo.language),
                added && h('span', { class: 'muted' }, 'sudah ada'),
            ),
            repo.description && h('p', { class: 'repo__text muted' }, repo.description),
        );
    }));

    updateGithubButton();
}

function updateGithubButton() {
    $('githubAdd').disabled = !state.selected.size;
    $('githubAdd').textContent = state.selected.size ? `Tambahkan ${state.selected.size} proyek` : 'Tambahkan';
}

async function addSelectedRepos() {
    const chosen = state.repos
        .filter((repo) => state.selected.has(repo.html_url))
        .map((repo) => fromGithubRepo(repo, SITE.githubUser));

    $('githubAdd').disabled = true;

    try {
        await addProjects(chosen);
        $('github').close();
        toast(`${chosen.length} proyek ditambahkan. Lengkapi kategori dan deskripsinya lewat tombol Ubah.`);
    } catch (error) {
        // Pesannya ditaruh di dua tempat: di atas daftar repo yang mungkin
        // sudah tergulir jauh, dan sebagai toast yang pasti terlihat.
        $('githubStatus').textContent = errorMessage(error);
        $('githubStatus').scrollIntoView({ block: 'nearest' });
        toast(errorMessage(error), 'error');
        updateGithubButton();
    }
}

/* --------------------------------------------------------------- cadangan */

/*
 * Siapa pun bisa menulis ke Firestore selama passwordnya cuma di kode
 * (lihat gate.js), jadi satu-satunya pemulihan kalau isinya dihapus orang
 * adalah salinan yang Anda simpan sendiri. Berkasnya bisa dimasukkan lagi
 * lewat tombol Pulihkan.
 */
async function downloadBackup() {
    try {
        const projects = await allProjects();
        const blob = new Blob([JSON.stringify(projects, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = h('a', { href: url, download: `portofolio-${new Date().toISOString().slice(0, 10)}.json` });

        document.body.append(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);

        toast(`${projects.length} proyek disalin ke berkas.`);
    } catch (error) {
        toast(errorMessage(error), 'error');
    }
}

async function restoreBackup(event) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
        return;
    }

    try {
        const rows = JSON.parse(await file.text());

        if (!Array.isArray(rows)) {
            throw new Error('Isi berkasnya bukan daftar proyek.');
        }

        // Yang namanya sudah ada dilewati, jadi memulihkan dua kali tidak
        // menggandakan isinya.
        const existing = new Set(state.projects.map((p) => p.name.toLowerCase()));
        const missing = rows.filter((row) => row?.name && !existing.has(String(row.name).toLowerCase()));

        if (!missing.length) {
            toast('Semua proyek di berkas itu sudah ada.');

            return;
        }

        await addProjects(missing);
        toast(`${missing.length} proyek dipulihkan.`);
    } catch (error) {
        toast(errorMessage(error), 'error');
    }
}

/* ----------------------------------------------------------------- mulai */

function startAdmin() {
    $('toolbar').hidden = false;

    $('search').addEventListener('input', (event) => {
        state.query = event.target.value.trim();
        renderList();
    });

    $('add').addEventListener('click', () => openEditor());
    $('editorForm').addEventListener('submit', submitEditor);
    $('editorCancel').addEventListener('click', () => $('editor').close());

    $('openGithub').addEventListener('click', openGithub);
    $('githubAdd').addEventListener('click', addSelectedRepos);
    $('githubCancel').addEventListener('click', () => $('github').close());

    $('backup').addEventListener('click', downloadBackup);
    $('restore').addEventListener('change', restoreBackup);

    watchProjects((projects) => {
        state.projects = projects;
        renderList();

        if ($('github').open && state.repos.length) {
            renderRepos();
        }
    }, (error) => {
        $('status').textContent = errorMessage(error);
    });
}

$('brand').textContent = SITE.title;
document.title = `Admin · ${SITE.title}`;

$('logout').addEventListener('click', () => {
    lock();
    location.replace('./');
});

// Yang belum membuka kunci dikembalikan ke halaman depan. Ini penjaga
// tampilan, bukan penjaga data; lihat gate.js.
if (!isUnlocked()) {
    location.replace('./');
} else if (!isConfigured) {
    $('status').textContent = '';
    setupNotice($('list'));
} else {
    startAdmin();
}
