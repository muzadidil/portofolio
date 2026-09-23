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
firestore.rules         aturan keamanan — penjaga data yang sebenarnya
assets/css/style.css
assets/js/config.js     judul, akun GitHub, email admin, firebaseConfig
assets/js/portfolio.js  aturan: kategori, pencarian, urutan, impor GitHub
assets/js/firebase.js   sambungan Firestore & login
assets/js/ui.js         bagian tampilan bersama
assets/js/public.js     halaman umum
assets/js/admin.js      halaman admin
```

## Memasang Firebase (sekali saja)

1. Buka <https://console.firebase.google.com>, **Add project**, beri nama
   mis. `portofolio-fuad`. Google Analytics tidak perlu. Proyek yang dipakai
   situs ini: `portofolio-1fa39`.
2. **Build → Firestore Database → Create database**, pilih **production
   mode**, lokasi `asia-southeast2 (Jakarta)`.
3. **Build → Authentication → Get started → Email/Password → Enable**.
4. **Authentication → Users → Add user**:
   - Email: `admin@portofolio-fuad.local` (harus sama persis dengan
     `ADMIN_EMAIL` di `assets/js/config.js`; tidak perlu email sungguhan)
   - Password: password admin pilihan Anda. Inilah yang diketik di kolom
     password di pojok kanan.
5. Salin **User UID** akun itu, lalu ganti `GANTI_DENGAN_UID_ADMIN` di
   `firestore.rules` dengan UID tersebut.
6. **Firestore Database → Rules**: tempel seluruh isi `firestore.rules`,
   lalu **Publish**.
7. **Project settings (⚙) → Your apps → Web (`</>`)**, daftarkan aplikasi,
   salin isi `firebaseConfig` ke `assets/js/config.js`.
8. **Authentication → Settings → Authorized domains → Add domain**:
   `muzadidil.github.io` (dan domain sendiri kalau ada).
9. Disarankan: **Authentication → Settings → User actions**, matikan
   **Enable create (sign-up)**, supaya tidak ada yang bisa membuat akun baru.

Lupa password? **Authentication → Users**, hapus akun admin, buat lagi
dengan email yang sama, lalu perbarui UID di `firestore.rules` (langkah 5–6).

### Kenapa bukan password di dalam kode

Di situs statis, semua kode terbaca siapa pun lewat *View Source*. Password
yang ditulis di kode (seperti `const PASSWORD = "…"`) langsung ketahuan, dan
Firestore yang terbuka bisa diubah siapa pun yang tahu `projectId`-nya.

Di sini password disimpan di Firebase Authentication dan diperiksa di server
Google, dan `firestore.rules` hanya mengizinkan akun admin menulis. Tampilan
login tetap sama: cukup password dan tombol Login.

## Menjalankan di komputer

Berkas JavaScript-nya berupa *module*, jadi harus dibuka lewat server, bukan
diklik dua kali:

- XAMPP (Apache menyala): <http://localhost/portofolio%20fuad/>
- atau: `php -S localhost:8000` di folder ini, lalu buka <http://localhost:8000>

Tambahkan `localhost` di **Authorized domains** (biasanya sudah ada) supaya
login bisa dicoba di komputer.

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
