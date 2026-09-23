/*
 * Sambungan ke Firebase: daftar proyek (Firestore) dan login admin
 * (Authentication).
 *
 * Satu-satunya berkas yang mengimpor SDK Firebase, jadi versinya cukup
 * diganti di sini.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getFirestore,
    onSnapshot,
    serverTimestamp,
    updateDoc,
    writeBatch,
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';
import { ADMIN_EMAIL, firebaseConfig } from './config.js';
import { normalizeProject } from './portfolio.js';

export const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

const app = isConfigured ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;

const projects = () => collection(db, 'projects');

/* ------------------------------------------------------------ proyek */

/**
 * Daftar proyek, diperbarui langsung setiap kali ada perubahan.
 * Mengembalikan fungsi untuk berhenti mendengarkan.
 */
export function watchProjects(onChange, onError) {
    return onSnapshot(projects(), (snapshot) => {
        onChange(snapshot.docs.map((d) => ({ id: d.id, ...normalizeProject(d.data()) })));
    }, onError);
}

export async function saveProject(id, input) {
    const data = { ...normalizeProject(input), updatedAt: serverTimestamp() };

    if (id) {
        await updateDoc(doc(db, 'projects', id), data);

        return id;
    }

    const ref = await addDoc(projects(), { ...data, createdAt: serverTimestamp() });

    return ref.id;
}

/** Banyak proyek sekaligus, satu penulisan: semuanya masuk atau tidak sama sekali. */
export async function addProjects(inputs) {
    const batch = writeBatch(db);

    for (const input of inputs) {
        batch.set(doc(projects()), {
            ...normalizeProject(input),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    }

    await batch.commit();
}

export function deleteProject(id) {
    return deleteDoc(doc(db, 'projects', id));
}

/* ------------------------------------------------------------- login */

/** Hanya password yang diketik; emailnya dari config.js. */
export function signIn(password) {
    return signInWithEmailAndPassword(auth, ADMIN_EMAIL, password);
}

export function signOut() {
    return firebaseSignOut(auth);
}

/**
 * Dipanggil setiap status login berubah, dan sekali saat halaman dibuka.
 * Yang diterima: true kalau yang login adalah admin.
 */
export function onAdminChange(callback) {
    if (!auth) {
        callback(false);

        return () => {};
    }

    return onAuthStateChanged(auth, (user) => {
        callback(Boolean(user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()));
    });
}

/** Pesan galat Firebase dalam bahasa manusia. */
export function errorMessage(error) {
    const code = error?.code ?? '';

    if (['auth/invalid-credential', 'auth/wrong-password', 'auth/invalid-login-credentials', 'auth/user-not-found'].includes(code)) {
        return 'Password salah.';
    }

    if (code === 'auth/too-many-requests') {
        return 'Terlalu banyak percobaan. Tunggu sebentar, lalu coba lagi.';
    }

    if (code === 'permission-denied') {
        return 'Ditolak: hanya admin yang boleh mengubah data.';
    }

    if (code === 'auth/network-request-failed' || code === 'unavailable') {
        return 'Tidak ada koneksi internet.';
    }

    return error?.message ?? String(error);
}
