# Panduan Deploy Dashboard Utama AbsensiKu 🚀

Folder ini (`deploy-dashboard`) telah disiapkan khusus agar Anda bisa mendeploy tampilan yang sama persis dengan yang ada di **localhost:3001** ke Netlify.

---

## Langkah Deploy ke Netlify:

1.  **Persiapkan URL API**:
    Pastikan di dalam file `deploy-dashboard/js/main.js`, konstanta `API` sudah mengarah ke URL Backend (Server) Anda yang sudah online, bukan ke `localhost`.

    ```javascript
    const API = "https://url-backend-anda.com/api";
    ```

2.  **Upload ke Netlify**:
    - Login ke [Netlify Dashboard](https://app.netlify.com/).
    - Pilih menu **"Add new site"** -> **"Deploy manually"**.
    - **Tarik (Drag & Drop) folder `deploy-dashboard`** ke area upload Netlify.

3.  **Selesai!**
    Netlify akan memberikan URL publik. Karena sudah ada file `_redirects`, fitur navigasi halaman tidak akan error saat di-refresh.

---

## Mengapa folder ini?

Folder `deploy-dashboard` ini berisi gabungan dari:

- `index.html`: Tampilan utama dashboard yang Anda sukai.
- `js/main.js`: Logika aplikasi yang sudah dikonsolidasikan.
- `_redirects`: Konfigurasi khusus Netlify agar Single Page Application (SPA) berjalan lancar.

> [!IMPORTANT]
> Jangan lupa untuk mendeploy **Backend** (Node.js) Anda ke layanan seperti Render atau Railway terlebih dahulu agar data bisa muncul di dashboard ini.
