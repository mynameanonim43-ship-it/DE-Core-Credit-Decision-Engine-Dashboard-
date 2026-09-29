// src/screens/analysis.js — Layar 3: Analisis Baru
import { saveBorrower, generateId, getBorrowerById } from '../data/store.js';
import { navigate } from '../utils/helpers.js';

export function renderAnalysis(container, params = {}) {
  // Accept both string id (legacy) and object {id} for edit mode
  const editId = (params && typeof params === 'object') ? params.id : (typeof params === 'string' ? params : null);
  const existing = editId ? getBorrowerById(editId) : null;
  container.innerHTML = `
    <div style="max-width: 1000px; margin: 0 auto;">
      <div style="margin-bottom: 24px;">
        <h2 style="margin: 0; color: var(--text-primary);">${existing ? 'Edit Analisis Kredit' : 'New Credit Analysis'}</h2>
        <p style="margin: 4px 0 0 0; color: var(--text-muted); font-size: 14px;">${existing ? `Mengedit data: <strong style="color:var(--text-primary)">${existing.name}</strong>` : 'Evaluate a new borrower based on the 5C framework with real-time scoring.'}</p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 350px; gap: 24px; align-items: start;">
        
        <!-- Left Column: Input Form -->
        <div class="card">
          <div class="card-header"><span class="card-title">5C Framework Input</span></div>
          <div class="card-body" style="padding: 24px;">
            
            <!-- 0. Identity -->
            <div style="margin-bottom: 24px;">
              <div style="font-weight: 600; color: var(--brand-light); margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">0. Borrower Identity (Identitas)</div>
              <div class="form-grid form-grid-2">
                <div class="form-group">
                  <label class="form-label">Full Name</label>
                  <input type="text" id="input-name" class="form-control" placeholder="e.g. Budi Santoso">
                </div>
                <div class="form-group">
                  <label class="form-label">National ID (NIK)</label>
                  <input type="text" id="input-nik" class="form-control" placeholder="16 digits NIK">
                </div>
                <div class="form-group" style="grid-column: span 2;">
                  <label class="form-label">Company / Business Name (Optional)</label>
                  <input type="text" id="input-company" class="form-control" placeholder="e.g. PT Maju Jaya">
                </div>
              </div>
            </div>

            <!-- 1. Capacity -->
            <div style="margin-bottom: 24px;">
              <div style="font-weight: 600; color: var(--brand-light); margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">1. Capacity (Kapasitas Pembayaran)</div>
              <div class="form-grid form-grid-2">
                <div class="form-group">
                  <label class="form-label">Monthly Income (Rp)</label>
                  <input type="number" id="input-income" class="form-control calc-trigger" placeholder="e.g. 50000000" value="50000000">
                </div>
                <div class="form-group">
                  <label class="form-label">Monthly Expenses (Rp)</label>
                  <input type="number" id="input-expenses" class="form-control calc-trigger" placeholder="e.g. 15000000" value="15000000">
                </div>
                <div class="form-group" style="grid-column: span 2;">
                  <label class="form-label">Existing Debt Installments (Rp)</label>
                  <input type="number" id="input-debt" class="form-control calc-trigger" placeholder="e.g. 5000000" value="5000000">
                </div>
              </div>
            </div>

            <!-- 2. Character -->
            <div style="margin-bottom: 24px;">
              <div style="font-weight: 600; color: var(--brand-light); margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">2. Character (Karakter Pribadi/Bisnis)</div>
              <div class="form-grid form-grid-2">
                <div class="form-group">
                  <label class="form-label">Years in Business / Employment</label>
                  <input type="number" id="input-years" class="form-control calc-trigger" value="5">
                </div>
                <div class="form-group">
                  <label class="form-label">Past Defaults / Late Payments</label>
                  <select id="input-defaults" class="form-control calc-trigger">
                    <option value="0">None (Clean Record)</option>
                    <option value="1">1 Time</option>
                    <option value="2">2+ Times</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- 3. Capital -->
            <div style="margin-bottom: 24px;">
              <div style="font-weight: 600; color: var(--brand-light); margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">3. Capital (Modal / Kekayaan)</div>
              <div class="form-group">
                <label class="form-label">Total Assets / Savings (Rp)</label>
                <input type="number" id="input-assets" class="form-control calc-trigger" value="150000000">
              </div>
            </div>

            <!-- 4. Collateral -->
            <div style="margin-bottom: 24px;">
              <div style="font-weight: 600; color: var(--brand-light); margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">4. Collateral (Agunan)</div>
              <div class="form-group">
                <label class="form-label">Estimated Collateral Value (Rp)</label>
                <input type="number" id="input-collateral" class="form-control calc-trigger" value="300000000">
              </div>
            </div>

            <!-- 5. Conditions -->
            <div>
              <div style="font-weight: 600; color: var(--brand-light); margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">5. Conditions (Kondisi Makro/Sektor)</div>
              <div class="form-group">
                <label class="form-label">Industry / Sector Risk</label>
                <select id="input-sector-risk" class="form-control calc-trigger">
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                </select>
              </div>
            </div>

          </div>
        </div>

        <!-- Right Column: Live Evaluation -->
        <div class="card" style="position: sticky; top: 24px;">
          <div class="card-header"><span class="card-title">Live Evaluation</span></div>
          <div class="card-body" style="display: flex; flex-direction: column; align-items: center; padding: 40px 24px;">
            
            <div style="font-size: 13px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Credit Score</div>
            
            <div id="eval-score" style="font-size: 72px; font-weight: 800; color: #10b981; line-height: 1.1; margin: 8px 0; font-family: 'JetBrains Mono', monospace; transition: color 0.3s ease;">
              100
            </div>
            
            <div id="eval-decision" style="padding: 6px 16px; border-radius: 20px; background: rgba(16,185,129,0.15); color: #10b981; font-weight: 600; font-size: 14px; letter-spacing: 0.5px; transition: all 0.3s ease;">
              APPROVED
            </div>

            <div style="width: 100%; height: 1px; background: var(--border); margin: 32px 0;"></div>

            <div style="width: 100%;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: var(--text-muted); font-size: 13px; font-weight: 500;">Debt Service Ratio (DSR)</span>
                <span id="eval-dsr-val" style="font-weight: 700; font-size: 14px; color: var(--text-primary); transition: color 0.3s ease;">0%</span>
              </div>
              <div style="width: 100%; height: 8px; background: var(--bg-hover); border-radius: 4px; overflow: hidden;">
                <div id="eval-dsr-bar" style="height: 100%; width: 0%; background: #10b981; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);"></div>
              </div>
              <div id="eval-dsr-msg" style="margin-top: 10px; font-size: 12px; color: var(--text-secondary); text-align: right; transition: color 0.3s ease;">
                Healthy DSR (< 40%)
              </div>
            </div>

            <button id="btn-save-analysis" class="btn btn-primary" style="width: 100%; margin-top: 40px; padding: 12px; font-size: 14px; font-weight: 600;">Save Analysis</button>
            
          </div>
        </div>

      </div>
    </div>
  `;

  // Attach event listeners after rendering
  const inputs = container.querySelectorAll('.calc-trigger');
  
  function calculateScore() {
    const income = parseFloat(container.querySelector('#input-income')?.value) || 0;
    const expenses = parseFloat(container.querySelector('#input-expenses')?.value) || 0;
    const debt = parseFloat(container.querySelector('#input-debt')?.value) || 0;
    
    const years = parseInt(container.querySelector('#input-years')?.value) || 0;
    const defaults = parseInt(container.querySelector('#input-defaults')?.value) || 0;
    const sectorRisk = container.querySelector('#input-sector-risk')?.value || 'low';

    // Calculate DSR
    let dsr = 0;
    if (income > 0) {
      dsr = ((expenses + debt) / income) * 100;
    }

    // Base Score
    let score = 100;
    
    // DSR Penalty
    if (dsr > 30) {
      score -= (dsr - 30);
    }

    // Character Penalty
    if (years < 2) score -= 10;
    if (defaults === 1) score -= 25;
    if (defaults > 1) score -= 50;

    // Condition Penalty
    if (sectorRisk === 'medium') score -= 5;
    if (sectorRisk === 'high') score -= 15;
    
    // Clamp score 0-100
    score = Math.max(0, Math.min(100, Math.round(score)));

    // UI Elements
    const scoreEl = container.querySelector('#eval-score');
    const dsrVal = container.querySelector('#eval-dsr-val');
    const dsrBar = container.querySelector('#eval-dsr-bar');
    const dsrMsg = container.querySelector('#eval-dsr-msg');
    const decisionEl = container.querySelector('#eval-decision');
    
    if (!scoreEl) return;

    // Update DSR visuals
    dsrVal.textContent = dsr.toFixed(1) + '%';
    dsrBar.style.width = Math.min(100, dsr) + '%';

  // State colors
  const COLOR_GREEN = '#10b981';
  const COLOR_YELLOW = '#f59e0b';
  const COLOR_RED = '#ef4444';

  if (dsr > 40) {
    scoreEl.style.color = COLOR_RED;
    dsrVal.style.color = COLOR_RED;
    dsrBar.style.background = COLOR_RED;
    dsrMsg.textContent = 'High Risk DSR (> 40%)';
    dsrMsg.style.color = COLOR_RED;
  } else if (dsr > 30) {
    scoreEl.style.color = COLOR_YELLOW;
    dsrVal.style.color = COLOR_YELLOW;
    dsrBar.style.background = COLOR_YELLOW;
    dsrMsg.textContent = 'Moderate DSR (30-40%)';
    dsrMsg.style.color = COLOR_YELLOW;
  } else {
    scoreEl.style.color = COLOR_GREEN;
    dsrVal.style.color = 'var(--text-primary)';
    dsrBar.style.background = COLOR_GREEN;
    dsrMsg.textContent = 'Healthy DSR (< 30%)';
    dsrMsg.style.color = 'var(--text-secondary)';
  }

  // Update Score Text
  scoreEl.textContent = score;

  // Update Decision Pill
  if (score >= 75 && dsr <= 40 && defaults === 0) {
    decisionEl.textContent = 'APPROVED';
    decisionEl.style.background = 'rgba(16,185,129,0.15)';
    decisionEl.style.color = COLOR_GREEN;
  } else if (score >= 50 && dsr <= 60 && defaults < 2) {
    decisionEl.textContent = 'MANUAL REVIEW';
    decisionEl.style.background = 'rgba(245,158,11,0.15)';
    decisionEl.style.color = COLOR_YELLOW;
  } else {
    decisionEl.textContent = 'REJECTED';
    decisionEl.style.background = 'rgba(239,68,68,0.15)';
    decisionEl.style.color = COLOR_RED;
  }
} // end calculateScore

  // Attach event listeners
  inputs.forEach(input => {
    input.addEventListener('input', calculateScore);
    input.addEventListener('change', calculateScore);
  });

  const btnSave = container.querySelector('#btn-save-analysis');
  if (btnSave) {
    btnSave.addEventListener('click', () => {
      const name = container.querySelector('#input-name')?.value || 'Unknown Borrower';
      const nik = container.querySelector('#input-nik')?.value || '-';
      const company = container.querySelector('#input-company')?.value || '-';
      
      const score = parseInt(container.querySelector('#eval-score')?.textContent) || 0;
      const decision = container.querySelector('#eval-decision')?.textContent || 'MANUAL REVIEW';
      
      // Determine status from decision
      let decisionMapped = 'REVIEW';
      if (decision === 'APPROVED') decisionMapped = 'LAYAK';
      if (decision === 'REJECTED') decisionMapped = 'TIDAK_LAYAK';

      const income = parseFloat(container.querySelector('#input-income')?.value) || 0;
      const expenses = parseFloat(container.querySelector('#input-expenses')?.value) || 0;
      const debt = parseFloat(container.querySelector('#input-debt')?.value) || 0;
      const sector = container.querySelector('#input-sector-risk')?.value || 'other';
      let dsr = 0;
      if (income > 0) dsr = ((expenses + debt) / income); // as ratio not percentage for ratios object
      
      // Save it
      saveBorrower({
        id: existing ? existing.id : generateId(),
        name,
        company,
        nik,
        sector,
        plafon: existing?.plafon ?? 500000000, 
        nominal: existing?.nominal ?? 500000000,
        tenor: existing?.tenor ?? 12,
        rate: existing?.rate ?? 12,
        finalScore: score,
        decision: decisionMapped,
        status: 'active',
        ratios: { dscr: dsr },
        ewsStatus: decision === 'REJECTED' ? 'red' : (decision === 'MANUAL REVIEW' ? 'yellow' : 'green')
      });

      if (window.showToast) window.showToast(existing ? 'Analisis berhasil diperbarui!' : 'Analisis Berhasil Disimpan!');
      navigate('borrowers');
    });
  }

  // Initial calculation
  calculateScore();
}
