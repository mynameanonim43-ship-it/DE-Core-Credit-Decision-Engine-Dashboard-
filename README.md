# 📊 Vantage — Credit Intelligence Platform

[![Live Demo](https://img.shields.io/badge/Demo-Live%20Dashboard-3b82f6?style=for-the-badge&logo=googlechrome&logoColor=white)](https://mynameanonim43-ship-it.github.io/DE-Core-Credit-Decision-Engine-Dashboard-/)
[![Tech Stack](https://img.shields.io/badge/Tech-Vanilla%20JS%20%7C%20CSS3%20%7C%20Canvas-10b981?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License](https://img.shields.io/badge/License-Proprietary-8b5cf6?style=for-the-badge)](LICENSE)

> **Next-Generation Automated Credit Decision Engine & Post-Disbursement Intelligence**  
> Solusi komprehensif berbasis data finansial dan kualitatif untuk menjembatani transparansi, akurasi, dan mitigasi risiko kredit portofolio institusi keuangan.

---

## 📖 Tentang Vantage

**Vantage Credit Intelligence Platform** lahir dari tantangan mendasar di industri perbankan dan fintech lending: proses underwriting kredit konvensional yang kerap lambat, fragmentaris, rentan bias subjektif analis, serta lemahnya monitoring kesehatan debitur setelah dana dicairkan.

Vantage mentransformasikan proses credit assessment menjadi **alat bantu keputusan cerdas (Decision Support System)** yang secara instan menjawab **3 Pertanyaan Krusial Kreditur**:

1. **"Apakah calon debitur ini layak didanai?"**  
   Dianalisis melalui pendekatan **3-Layer Hybrid Decision Engine** yang memadukan eliminasi kriteria mutlak (*Hard Rules*), skoring tertimbang 6 pilar (*6-Pillar Scoring*), dan penyelarasan otomatis terhadap benchmark industri IDX (*Gap Override*).
2. **"Berapa batas nominal kredit yang aman dan presisi?"**  
   Dihitung secara algoritmis berbasis kapasitas arus kas riil untuk melunasi utang (*DSCR & Free Cash Flow Constraints*), dibatasi oleh valuasi agunan (*LTV Risk Coverage*), dan batas plafon yang diajukan.
3. **"Apa dasar dan alasan bobot penentuannya?"**  
   Transparan dan objektif. Vantage mengadopsi formulasi bobot dinamis (*Dynamic Weighting*) yang secara cerdas menyesuaikan komposisi faktor kuantitatif vs. kualitatif berdasarkan profil kedewasaan usaha (*Startup*, *UKM*, maupun *Korporat*).

Pasca-pencairan, Vantage terus mengawal portofolio melalui **Early Warning System (EWS) 20 Parameter** yang memantau anomali keuangan, transaksi rekening, dan dinamika operasional sebelum terjadi gagal bayar (NPL).

---

## ⚡ Akses Cepat

| Navigasi | Tautan |
|---|---|
| 🌐 **Buka Dashboard Online** | [👉 Buka Vantage Live Demo](https://mynameanonim43-ship-it.github.io/DE-Core-Credit-Decision-Engine-Dashboard-/) *(Langsung via GitHub Pages)* |
| 📥 **Unduh Source Code (.ZIP)** | [👉 Download File ZIP](https://github.com/mynameanonim43-ship-it/DE-Core-Credit-Decision-Engine-Dashboard-/archive/refs/heads/main.zip) |

---

## 🌟 Fitur Unggulan

### 🛡️ 1. 3-Layer Decision Engine
- **Layer 1 — Hard Rules:** Filtrasi ketat kriteria mutlak (DSCR < 1.0, ICR < 1.0, OCF negatif 2 periode berturut-turut, keterlambatan bayar > 90 hari, DAR ≥ 0.90, Altman Z-Score zona bahaya).
- **Layer 2 — 6-Pillar Weighted Scoring:** Evaluasi komprehensif mencakup Likuiditas, Solvabilitas, Profitabilitas, Efisiensi, Kualitatif/Bisnis, dan Agunan.
- **Layer 3 — Gap Analysis vs. IDX Benchmark:** Mengomparasikan 20 rasio keuangan peminjam terhadap data benchmark riil Bursa Efek Indonesia (11 sektor industri). Jika terjadi deviasi negatif parah (>30%), sistem secara otomatis mengoverride keputusan menjadi penolakan/review ketat.

### 💰 2. Kalkulator Nominal Berbasis Kapasitas & Risiko
- Menghilangkan *guesswork* plafon pinjaman.
- Menghitung cicilan maksimal yang dapat ditanggung tanpa mengganggu kas operasional harian.
- Memberikan simulasi tenor dan bunga yang proporsional dengan profil risiko debitur.

### 🚨 3. Early Warning System (EWS) 20 Parameter
- **10 Parameter Finansial:** DSCR, ICR, rasio kas, penurunan omzet mendadak, Altman Z-Score shift, dll.
- **5 Parameter Perilaku:** Pola keterlambatan cicilan, responsivitas manajemen, turnover eksekutif kunci, dll.
- **5 Parameter Operasional:** Retensi pelanggan, penumpukan stok (*inventory buildup*), kepatuhan covenant pinjaman, dll.
- Menghasilkan status Kolektibilitas OJK dan *actionable judgment* (🟢 Aman, 🟡 Waspada / Cek Lapangan, 🔴 Jangan Lanjut / Restrukturisasi Segera).

---

## 🖥️ 5 Layar Utama Platform

1. **🏠 Dashboard Portofolio:** Tinjauan eksekutif metrik portofolio, rasio persetujuan (*approval rate*), sebaran sektor, tren historis, dan radar debitur EWS kritis.
2. **👥 Direktori Borrower:** Database terpusat seluruh debitur dengan filter dinamis, pencarian instan, dan indikator status kredit.
3. **➕ Wizard Analisis Baru (5 Langkah):**
   - *Langkah 1:* Profil Borrower & Pengajuan Plafon
   - *Langkah 2:* Input Laporan Keuangan & Live Rasio Preview
   - *Langkah 3:* Penilaian Kualitatif, Tata Kelola & Prospek Pasar
   - *Langkah 4:* Penilaian Agunan & Legalitas Jaminan
   - *Langkah 5:* Review Terpadu & Kalkulasi Otomatis Mesin Keputusan
4. **🔎 Detail Borrower 360°:** Visualisasi profil holistik, grafik radar rasio vs IDX benchmark, riwayat fasilitas kredit, serta panel monitoring EWS mendalam.
5. **⚙️ Pusat Konfigurasi & Pengaturan:** Fleksibilitas dalam menyesuaikan ambang batas (*threshold*), bobot masing-masing pilar, dan matriks benchmark sektoral.

---

## 💻 Cara Menjalankan Secara Lokal

1. **Clone repositori:**
   ```bash
   git clone https://github.com/mynameanonim43-ship-it/DE-Core-Credit-Decision-Engine-Dashboard-.git
   cd DE-Core-Credit-Decision-Engine-Dashboard-
   ```

2. **Jalankan Web Server Lokal:**
   *Menggunakan Node.js / npx:*
   ```bash
   npx serve .
   ```
   *Atau menggunakan Python:*
   ```bash
   python -m http.server 3000
   ```

3. **Buka di Browser:**
   Akses `http://localhost:3000` di Google Chrome atau browser favorit Anda.

---

## 🎨 Desain & Antarmuka
Dirancang dengan estetika **Dark-Mode Glassmorphism**, tipografi modern Inter & JetBrains Mono, micro-interactions responsif, serta *Splash Screen* pembuka yang memberikan pengalaman pengguna sekelas aplikasi enterprise institusi keuangan modern.

---

## 📄 Lisensi
Hak Cipta © 2026 **Vantage Credit Intelligence Platform**. Seluruh hak cipta dilindungi undang-undang.
