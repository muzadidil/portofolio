/*
 * Pengaturan situs. Satu-satunya berkas yang perlu diubah saat memasang.
 *
 * Semua isi berkas ini terbaca siapa pun yang membuka halamannya — itu
 * wajar untuk situs statis, dan tidak apa-apa: firebaseConfig memang bukan
 * rahasia, dan yang menjaga data adalah firestore.rules, bukan kode di sini.
 * Password admin TIDAK ditulis di sini; ia disimpan di Firebase
 * Authentication dan diperiksa di server Google.
 */

export const SITE = {
    title: 'Portofolio Fuad',
    tagline: 'Kumpulan proyek yang pernah saya kerjakan — dari spreadsheet, Golang, sampai Next.js.',

    // Akun GitHub untuk tautan profil dan tombol "Ambil dari GitHub".
    githubUser: 'muzadidil',
};

/*
 * Password halaman admin.
 *
 * PERHATIAN: password ini terbaca siapa pun yang membuka View Source di
 * situs yang sudah terbit. Ia hanya menutup pintu halaman admin dari
 * orang yang tidak sengaja masuk; ia TIDAK menjaga datanya. Jangan
 * memakai password yang juga Anda pakai di tempat lain.
 *
 * Menggantinya berarti mengubah baris ini lalu push ulang.
 */
export const ADMIN_PASSWORD = 'ganti-password-ini';

/*
 * Dari Firebase Console → Project settings → Your apps → Web app.
 * Selama masih kosong, halaman menampilkan pesan "Firebase belum diatur".
 */
export const firebaseConfig = {
    apiKey: 'AIzaSyDxsEXVsU7z_JmhHOkXeRMYoOEZrcHu5v8',
    authDomain: 'portofolio-1fa39.firebaseapp.com',
    projectId: 'portofolio-1fa39',
    storageBucket: 'portofolio-1fa39.firebasestorage.app',
    messagingSenderId: '351015907562',
    appId: '1:351015907562:web:2df9015892df8dcef5a793',
};
