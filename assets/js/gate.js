/*
 * Kunci halaman admin: password dicocokkan di peramban, lalu diingat
 * selama tab masih terbuka.
 *
 * Ini PENJAGA TAMPILAN, bukan penjaga data. Passwordnya ada di
 * config.js, dan seluruh kode halaman terbaca siapa pun lewat View
 * Source — jadi yang tahu caranya tetap bisa menulis ke Firestore tanpa
 * melewati kotak ini. Yang dijaga cuma orang yang tidak sengaja membuka
 * admin.html.
 *
 * Kalau suatu saat datanya perlu benar-benar dijaga, gantinya adalah
 * Firebase Authentication: password diperiksa di server Google, dan
 * firestore.rules hanya mengizinkan akun admin menulis. Caranya ada di
 * README.
 */

import { ADMIN_PASSWORD } from './config.js';

const KEY = 'portofolio.admin';

/** Sesi tab ini: tertutup lagi begitu tabnya ditutup. */
export function isUnlocked() {
    try {
        return sessionStorage.getItem(KEY) === '1';
    } catch {
        // Peramban dengan penyimpanan diblokir: anggap belum membuka.
        return false;
    }
}

export function unlock(password) {
    if (String(password) !== String(ADMIN_PASSWORD)) {
        return false;
    }

    try {
        sessionStorage.setItem(KEY, '1');
    } catch {
        // Tetap dianggap terbuka untuk halaman ini.
    }

    return true;
}

export function lock() {
    try {
        sessionStorage.removeItem(KEY);
    } catch {
        // tidak ada yang perlu dibereskan
    }
}
