/*
 * Sambungan ke Firebase: daftar proyek (Firestore) dan login admin
 * (Authentication).
 *
 * Satu-satunya berkas yang mengimpor SDK Firebase, jadi versinya cukup
 * diganti di sini.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    getFirestore,
    onSnapshot,
    serverTimestamp,
    updateDoc,
    writeBatch,
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';
import { firebaseConfig } from './config.js';
import { normalizeProject } from './portfolio.js';

export const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

const app = isConfigured ? initializeApp(firebaseConfig) : null;
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

/** Seluruh proyek sekali ambil, untuk tombol cadangan di halaman admin. */
export async function allProjects() {
    const snapshot = await getDocs(projects());

    return snapshot.docs.map((d) => ({ id: d.id, ...normalizeProject(d.data()) }));
}

/** Pesan galat Firestore dalam bahasa manusia. */
export function errorMessage(error) {
    const code = error?.code ?? '';

    if (code === 'permission-denied') {
        return 'Ditolak oleh aturan keamanan Firestore. Pastikan isi firestore.rules sudah dipasang lewat Firebase Console.';
    }

    if (code === 'unavailable' || code === 'auth/network-request-failed') {
        return 'Tidak ada koneksi ke Firestore.';
    }

    if (code === 'not-found') {
        return 'Database Firestore belum dibuat di Firebase Console.';
    }

    return error?.message ?? String(error);
}
