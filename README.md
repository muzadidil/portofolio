# Portofolio Fuad

Daftar proyek yang pernah saya kerjakan: tanpa gambar, cukup list, kategori
di samping, dan kolom pencarian. Klik satu proyek untuk melihat deskripsi,
tahun, status, dan tautannya.

Situs statis untuk **GitHub Pages**, dengan data di **Firestore**.

- **Pengunjung** hanya melihat daftar dan mencari.
- **Admin** mengetik password di pojok kanan atas, tekan **Login**, lalu
  masuk ke halaman admin untuk menambah, mengubah, dan menghapus proyek, atau
  mengambil repo dari GitHub.

## Isi folder

```
index.html              halaman umum: daftar, kategori, pencarian, login
admin.html              halaman admin: CRUD + ambil dari GitHub
tests.html              tes aturan daftar (buka di peramban)
firestore.rules         aturan Firestore: bentuk data & koleksi yang boleh
assets/css/style.css
assets/js/config.js     judul, akun GitHub, password admin, firebaseConfig
assets/js/portfolio.js  aturan: kategori, pencarian, urutan, impor GitHub
assets/js/firebase.js   sambungan Firestore
assets/js/gate.js       kunci halaman admin (password di kode)
assets/js/ui.js         bagian tampilan bersama
assets/js/public.js     halaman umum
assets/js/admin.js      halaman admin
```

## Memasang Firebase (sekali saja)

1. Proyek Firebase yang dipakai situs ini: `portofolio-1fa39`. Kalau membuat
   yang baru: <https://console.firebase.google.com> → **Add project**.
2. **Build → Firestore Database → Create database**, pilih **production
   mode**, lokasi `asia-southeast2 (Jakarta)`.
3. **Firestore Database → Rules**: tempel seluruh isi `firestore.rules`,
   lalu **Publish**.
4. **Project settings (⚙) → Your apps → Web (`</>`)**, daftarkan aplikasi,
   salin isi `firebaseConfig` ke `assets/js/config.js`.
5. Ganti `ADMIN_PASSWORD` di `assets/js/config.js`, lalu push.

Firebase Authentication tidak dipakai, jadi tidak ada akun yang perlu dibuat.

## Password admin dan batasnya

Password halaman admin ada di `assets/js/config.js`, dan **terbaca siapa pun**
yang membuka *View Source* di situs yang sudah terbit. Ia menutup tampilan
halaman admin, bukan datanya: `firestore.rules` terpaksa mengizinkan siapa
saja menulis ke koleksi `projects`, karena tidak ada akun yang bisa diperiksa
di server.

Yang masih dijaga aturan Firestore: hanya koleksi `projects` yang bisa
disentuh, bentuk datanya harus benar, dan ukurannya dibatasi.

Karena itu: **tekan "Cadangkan" di halaman admin sesekali**, dan simpan
berkas JSON-nya. Kalau isinya dihapus orang, tombol "Pulihkan" memasukkannya
kembali.

Kalau suatu saat mau benar-benar dikunci, caranya ada di komentar paling atas
`firestore.rules`: nyalakan Firebase Authentication → Email/Password, buat
satu akun admin, lalu ganti `allow write` agar memeriksa UID akun itu.
Tampilan login tetap sama — cukup password.

## Menjalankan di komputer

Berkas JavaScript-nya berupa *module*, jadi harus dibuka lewat server, bukan
diklik dua kali:

- XAMPP (Apache menyala): <http://localhost/portofolio%20fuad/>
- atau: `php -S localhost:8000` di folder ini, lalu buka <http://localhost:8000>

## Menerbitkan ke GitHub Pages

1. Repo situs ini: <https://github.com/muzadidil/portofolio>.
2. Repo → **Settings → Pages → Build and deployment**: *Deploy from a
   branch*, branch `main`, folder `/ (root)`.
3. Situsnya muncul di `https://muzadidil.github.io/portofolio/`.

Berkas `.nojekyll` membuat GitHub Pages menyajikan berkas apa adanya.

## Ambil dari GitHub

Di halaman admin, **Ambil dari GitHub** menampilkan repo publik milik
`github.com/muzadidil` (tanpa fork). Centang yang ingin dimasukkan, lalu
**Tambahkan**. Yang sudah ada di daftar ditandai *sudah ada* dan tidak bisa
dipilih lagi.

Tiap repo diisi otomatis: nama, deskripsi, link tujuan (alamat repo), link
preview (kolom *Website* repo, atau alamat GitHub Pages-nya kalau aktif),
tahun dibuat, dan kategori dari bahasa utama serta *topics* repo. Lengkapi
sisanya lewat **Ubah**.

## Kategori

Satu proyek boleh punya beberapa kategori, dipisahkan koma saat mengisi.
Ejaan disamakan otomatis, supaya satu kategori tidak muncul dua kali di
sidebar: `Next.JS` → `next js`, `Go` → `golang`, `Google Sheets` → `sheet`.
Daftarnya ada di `ALIASES` dalam `assets/js/portfolio.js`.

## Tes

Buka `tests.html` lewat server lokal. Semua baris harus hijau. Tesnya tidak
butuh Firebase maupun internet.
