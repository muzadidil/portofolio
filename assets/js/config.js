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
 * Email akun admin di Firebase Authentication.
 *
 * Di halaman hanya password yang diketik; email ini yang dipasangkan
 * dengannya. Tidak perlu email sungguhan — tidak pernah ada surel yang
 * dikirim ke sana. Buat akunnya di Firebase Console → Authentication →
 * Users → Add user, dengan email ini persis dan password pilihan Anda.
 */
export const ADMIN_EMAIL = 'admin@portofolio-fuad.local';

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
