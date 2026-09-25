# 📊 Vantage — Credit Intelligence Platform

Platform Analisis Kredit & Credit Decision Engine cerdas berbasis web untuk membantu analis dan komite kredit dalam mengevaluasi kelayakan pinjaman borrower, menghitung batas nominal rekomendasi, serta memonitor Early Warning System (EWS) pasca-pencairan secara komprehensif.

---

## ⚡ Akses Cepat

| Aksi | Tautan |
|---|---|
| 🌐 **Buka Dashboard Langsung** | [Buka Vantage Live Demo](https://mynameanonim43-ship-it.github.io/DE-Core-Credit-Decision-Engine-Dashboard-/) *(via GitHub Pages)* |
| 📥 **Download File Proyek (.ZIP)** | [Download ZIP](https://github.com/mynameanonim43-ship-it/DE-Core-Credit-Decision-Engine-Dashboard-/archive/refs/heads/main.zip) |

---

## 🌟 Fitur Utama

### 1. 3-Layer Decision Engine
- **Layer 1 — Hard Rules:** Filtrasi ketat kriteria mutlak (DSCR < 1.0, ICR < 1.0, OCF negatif berturut-turut, keterlambatan bayar > 90 hari, DAR ≥ 0.90, Altman Z-Score distress).
- **Layer 2 — 6-Pillar Weighted Scoring:** Penilaian komprehensif 6 pilar (Likuiditas, Solvabilitas, Profitabilitas, Efisiensi, Kualitatif/Bisnis, Agunan) disesuaikan dengan profil perusahaan (Startup, UKM, Korporat).
- **Layer 3 — Gap Analysis & Override:** Perbandingan 20 rasio keuangan terhadap benchmark industri IDX (11 sektor). Jika rata-rata gap defisit > 30% atau ≥3 rasio utama defisit parah, keputusan otomatis di-override.

### 2. Rekomendasi Nominal Kredit Berbasis Risiko
- Kalkulasi plafon maksimal berbasis kapasitas bayar riil (DSCR-constrained).
- Batasan LTV agunan (*collateral coverage*).
- Penyesuaian tiering bunga dan tenor.

### 3. Early Warning System (EWS) Monitor — 20 Parameter
- Monitoring 20 parameter post-disbursement: 10 parameter keuangan, 5 parameter perilaku/rekening, 5 parameter operasional.
- Status kolektibilitas OJK & rekomendasi tindakan (*actionable judgement*).

---

## 🖥️ 5 Layar Utama

1. **Dashboard Portofolio:** Ringkasan KPI, distribusi keputusan, breakdown sektor, tren analisis, dan radar EWS aktif.
2. **Daftar Borrower:** Manajemen data borrower dengan filter status keputusan, pencarian, dan sorting multi-kolom.
3. **Analisis Baru (Wizard 5 Langkah):**
   - Langkah 1: Profil Perusahaan & Pengajuan
   - Langkah 2: Laporan Keuangan & Rasio Real-time
   - Langkah 3: Penilaian Kualitatif & Manajemen
   - Langkah 4: Penilaian Agunan & Legalitas
   - Langkah 5: Review & Eksekusi Kalkulasi Mesin
4. **Detail Borrower:** Profil lengkap, radar chart rasio vs benchmark IDX, riwayat fasilitas, dan panel EWS 20 parameter.
5. **Pengaturan:** Kustomisasi bobot pilar, ambang batas *cut-off*, dan konfigurasi benchmark industri.

---

## 🚀 Cara Menjalankan Secara Lokal

1. **Clone repositori ini:**
   ```bash
   git clone https://github.com/mynameanonim43-ship-it/DE-Core-Credit-Decision-Engine-Dashboard-.git
   cd DE-Core-Credit-Decision-Engine-Dashboard-
   ```

2. **Jalankan local web server:**
   Menggunakan Node.js / npx:
   ```bash
   npx serve .
   ```
   *Atau menggunakan Python:*
   ```bash
   python -m http.server 3000
   ```

3. **Buka di browser:**
   Akses `http://localhost:3000` di Google Chrome atau browser pilihan Anda.

---

## 📄 Lisensi
Hak Cipta © 2026 Vantage Credit Intelligence. Semua hak dilindungi.
