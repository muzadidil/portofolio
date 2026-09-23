/*
 * Halaman umum: daftar proyek, kategori di samping, dan kolom pencarian.
 * Pengunjung hanya melihat. Login di pojok kanan membawa admin ke
 * admin.html.
 */

import { SITE } from './config.js';
import { errorMessage, isConfigured, onAdminChange, signIn, signOut, watchProjects } from './firebase.js';
import { categoryCounts, filterProjects, sortProjects } from './portfolio.js';
import { categoryTags, h, projectDetail, setupNotice, statusBadge, toneOf } from './ui.js';

const $ = (id) => document.getElementById(id);

const state = {
    projects: [],
    loaded: false,
    query: '',
    open: new Set(),
};

/* Kategori yang dipilih disimpan di alamat (#golang), jadi bisa dibagikan. */
function currentCategory() {
    return decodeURIComponent(location.hash.slice(1));
}

/* ------------------------------------------------------------ tampilan */

function renderCategories() {
    const active = currentCategory();
    const link = (name, label, count) => h('a', {
        class: `category${name === active ? ' category--active' : ''}`,
        href: name ? `#${encodeURIComponent(name)}` : '#',
        'aria-current': name === active ? 'page' : null,
    },
        h('span', { class: 'category__dot', 'data-tone': name ? toneOf(name) : null, 'aria-hidden': 'true' }),
        h('span', { class: 'category__name' }, label),
        h('span', { class: 'category__count' }, count),
    );

    $('categories').replaceChildren(
        link('', 'Semua', state.projects.length),
        ...categoryCounts(state.projects).map((c) => link(c.name, c.name, c.count)),
    );
}

function renderList() {
    const category = currentCategory();
    const shown = sortProjects(filterProjects(state.projects, { category, query: state.query }));

    // Kategori yang aktif ditampilkan di atas daftar dengan tombol ×, supaya
    // tetap kelihatan di ponsel saat sidebarnya tertutup.
    $('summary').replaceChildren(!state.loaded
        ? 'Memuat…'
        : `${shown.length} proyek${state.query ? ` untuk "${state.query}"` : ''}`,
    state.loaded && category && h('a', {
        class: 'filter-chip',
        href: '#',
        'data-tone': toneOf(category),
        'aria-label': `Hapus saringan ${category}`,
    }, category, h('span', { 'aria-hidden': 'true' }, '×')));

    if (state.loaded && !shown.length) {
        $('list').replaceChildren(h('li', { class: 'empty' },
            state.projects.length ? 'Tidak ada proyek yang cocok.' : 'Belum ada proyek.'));

        return;
    }

    $('list').replaceChildren(...shown.map((project) => {
        const open = state.open.has(project.id);
        const detailId = `detail-${project.id}`;

        return h('li', { class: `project${open ? ' project--open' : ''}` },
            h('button', {
                type: 'button',
                class: 'project__row',
                'aria-expanded': String(open),
                'aria-controls': detailId,
                onclick: () => {
                    state.open.has(project.id) ? state.open.delete(project.id) : state.open.add(project.id);
                    renderList();
                },
            },
                h('span', { class: 'project__name' }, project.name),
                categoryTags(project.categories),
                h('span', { class: 'project__meta' }, project.year ?? '', statusBadge(project.status)),
                h('span', { class: 'project__chevron', 'aria-hidden': 'true' }, '›'),
            ),
            open && h('div', { id: detailId }, projectDetail(project)),
        );
    }));
}

function renderStats() {
    $('statProjects').textContent = state.loaded ? state.projects.length : '–';
    $('statCategories').textContent = state.loaded ? categoryCounts(state.projects).length : '–';
}

function render() {
    renderStats();
    renderCategories();
    renderList();
}

/* ------------------------------------------------- sidebar di ponsel */

/*
 * Di layar lebar sidebar selalu tampil. Di ponsel ia menjadi panel yang
 * digeser dari kiri lewat tombol ☰, dan tertutup sendiri begitu satu
 * kategori dipilih.
 */
function setSidebar(open) {
    document.body.classList.toggle('sidebar-open', open);
    $('backdrop').hidden = !open;
    $('menuButton').setAttribute('aria-expanded', String(open));

    // Fokus pindah ke panel, supaya Tab berikutnya langsung ke kategori.
    if (open) {
        $('sidebar').focus();
    }
}

function setupSidebar() {
    $('menuButton').addEventListener('click', () => setSidebar(true));
    $('sidebarClose').addEventListener('click', () => setSidebar(false));
    $('backdrop').addEventListener('click', () => setSidebar(false));
    $('categories').addEventListener('click', (event) => {
        if (event.target.closest('.category')) {
            setSidebar(false);
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && document.body.classList.contains('sidebar-open')) {
            setSidebar(false);
            $('menuButton').focus();
        }
    });

    // Kembali ke layar lebar: panelnya tidak boleh tertinggal terbuka.
    matchMedia('(min-width: 761px)').addEventListener('change', (event) => {
        if (event.matches) {
            setSidebar(false);
        }
    });
}

/* --------------------------------------------------------------- login */

function setupLogin() {
    $('login').addEventListener('submit', async (event) => {
        event.preventDefault();

        const button = event.submitter;
        button.disabled = true;
        $('loginError').textContent = '';

        try {
            await signIn($('password').value);
            location.href = 'admin.html';
        } catch (error) {
            $('loginError').textContent = errorMessage(error);
            $('password').select();
        } finally {
            button.disabled = false;
        }
    });

    $('logout').addEventListener('click', () => signOut());

    onAdminChange((isAdmin) => {
        $('login').hidden = isAdmin;
        $('adminLinks').hidden = !isAdmin;
    });
}

/* ---------------------------------------------------------------- mulai */

function start() {
    const github = `https://github.com/${SITE.githubUser}`;

    document.title = SITE.title;
    $('brand').textContent = SITE.title;
    $('topbarTitle').textContent = SITE.title;
    $('heroTitle').textContent = SITE.title;
    $('tagline').textContent = SITE.tagline;
    $('githubLink').href = github;
    $('githubLink').textContent = `github.com/${SITE.githubUser} ↗`;
    $('footer').replaceChildren(
        h('span', {}, `© ${new Date().getFullYear()} ${SITE.title}`),
        h('a', { href: github, target: '_blank', rel: 'noopener' }, 'GitHub ↗'),
    );

    $('search').addEventListener('input', (event) => {
        state.query = event.target.value.trim();
        renderList();
    });

    window.addEventListener('hashchange', render);
    setupSidebar();

    if (!isConfigured) {
        setupNotice($('list'));
        $('summary').textContent = '';

        return;
    }

    setupLogin();

    watchProjects((projects) => {
        state.projects = projects;
        state.loaded = true;
        render();
    }, (error) => {
        $('summary').textContent = errorMessage(error);
    });

    render();
}

start();
