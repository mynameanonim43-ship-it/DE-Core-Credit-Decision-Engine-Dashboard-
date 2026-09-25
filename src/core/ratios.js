// src/core/ratios.js
// Kalkulasi semua rasio keuangan dari input mentah

/**
 * Hitung DSCR (Debt Service Coverage Ratio)
 * DSCR = EBIT / Total Debt Service (pokok + bunga dalam 1 tahun)
 */
export function calcDSCR(ebit, annualDebtService) {
  if (!annualDebtService || annualDebtService <= 0) return null;
  return ebit / annualDebtService;
}

/**
 * Hitung ICR (Interest Coverage Ratio)
 * ICR = EBIT / Interest Expense
 */
export function calcICR(ebit, interestExpense) {
  if (!interestExpense || interestExpense <= 0) return null;
  return ebit / interestExpense;
}

/**
 * Hitung DTI (Debt-to-Income)
 * DTI = Total Debt Service / Gross Revenue × 100
 */
export function calcDTI(annualDebtService, grossRevenue) {
  if (!grossRevenue || grossRevenue <= 0) return null;
  return (annualDebtService / grossRevenue) * 100;
}

/**
 * Hitung ROA (Return on Assets)
 * ROA = Net Income / Total Assets × 100
 */
export function calcROA(netIncome, totalAssets) {
  if (!totalAssets || totalAssets <= 0) return null;
  return (netIncome / totalAssets) * 100;
}

/**
 * Hitung ROE (Return on Equity)
 * ROE = Net Income / Total Equity × 100
 */
export function calcROE(netIncome, totalEquity) {
  if (!totalEquity || totalEquity <= 0) return null;
  return (netIncome / totalEquity) * 100;
}

/**
 * Hitung DER (Debt-to-Equity Ratio)
 * DER = Total Liabilities / Total Equity
 */
export function calcDER(totalLiabilities, totalEquity) {
  if (!totalEquity || totalEquity <= 0) return null;
  return totalLiabilities / totalEquity;
}

/**
 * Hitung DAR (Debt-to-Asset Ratio)
 * DAR = Total Liabilities / Total Assets
 */
export function calcDAR(totalLiabilities, totalAssets) {
  if (!totalAssets || totalAssets <= 0) return null;
  return totalLiabilities / totalAssets;
}

/**
 * Hitung Current Ratio
 * CR = Current Assets / Current Liabilities
 */
export function calcCurrentRatio(currentAssets, currentLiabilities) {
  if (!currentLiabilities || currentLiabilities <= 0) return null;
  return currentAssets / currentLiabilities;
}

/**
 * Hitung Quick Ratio
 * QR = (Current Assets - Inventory) / Current Liabilities
 */
export function calcQuickRatio(currentAssets, inventory, currentLiabilities) {
  if (!currentLiabilities || currentLiabilities <= 0) return null;
  return (currentAssets - inventory) / currentLiabilities;
}

/**
 * Hitung Cash Ratio
 * CashR = (Cash + Cash Equivalents) / Current Liabilities
 */
export function calcCashRatio(cash, currentLiabilities) {
  if (!currentLiabilities || currentLiabilities <= 0) return null;
  return cash / currentLiabilities;
}

/**
 * Hitung NPM (Net Profit Margin)
 * NPM = Net Income / Revenue × 100
 */
export function calcNPM(netIncome, revenue) {
  if (!revenue || revenue <= 0) return null;
  return (netIncome / revenue) * 100;
}

/**
 * Hitung GPM (Gross Profit Margin)
 * GPM = (Revenue - COGS) / Revenue × 100
 */
export function calcGPM(revenue, cogs) {
  if (!revenue || revenue <= 0) return null;
  return ((revenue - cogs) / revenue) * 100;
}

/**
 * Hitung EBIT Margin
 * EBIT Margin = EBIT / Revenue × 100
 */
export function calcEBITMargin(ebit, revenue) {
  if (!revenue || revenue <= 0) return null;
  return (ebit / revenue) * 100;
}

/**
 * Hitung LTV (Loan-to-Value)
 * LTV = Loan Amount / Collateral Value × 100
 */
export function calcLTV(loanAmount, collateralValue) {
  if (!collateralValue || collateralValue <= 0) return null;
  return (loanAmount / collateralValue) * 100;
}

/**
 * Hitung Asset Turnover
 * AT = Revenue / Total Assets
 */
export function calcAssetTurnover(revenue, totalAssets) {
  if (!totalAssets || totalAssets <= 0) return null;
  return revenue / totalAssets;
}

/**
 * Hitung Days Receivable (DSO)
 * DSO = Accounts Receivable / Revenue × 365
 */
export function calcReceivableDays(accountsReceivable, revenue) {
  if (!revenue || revenue <= 0) return null;
  return (accountsReceivable / revenue) * 365;
}

/**
 * Hitung Days Inventory
 * DIO = Inventory / COGS × 365
 */
export function calcInventoryDays(inventory, cogs) {
  if (!cogs || cogs <= 0) return null;
  return (inventory / cogs) * 365;
}

/**
 * Hitung Days Payable (DPO)
 * DPO = Accounts Payable / COGS × 365
 */
export function calcPayableDays(accountsPayable, cogs) {
  if (!cogs || cogs <= 0) return null;
  return (accountsPayable / cogs) * 365;
}

/**
 * Hitung Altman Z-Score (untuk manufaktur & perusahaan publik)
 * Z = 1.2×X1 + 1.4×X2 + 3.3×X3 + 0.6×X4 + 1.0×X5
 * X1 = Working Capital / Total Assets
 * X2 = Retained Earnings / Total Assets
 * X3 = EBIT / Total Assets
 * X4 = Market Cap / Total Liabilities  (atau book equity jika privat)
 * X5 = Revenue / Total Assets
 */
export function calcAltmanZ({ workingCapital, retainedEarnings, ebit, equity, totalLiabilities, revenue, totalAssets }) {
  if (!totalAssets || totalAssets <= 0) return null;
  const X1 = workingCapital / totalAssets;
  const X2 = retainedEarnings / totalAssets;
  const X3 = ebit / totalAssets;
  const X4 = equity / (totalLiabilities || 1);
  const X5 = revenue / totalAssets;
  return 1.2 * X1 + 1.4 * X2 + 3.3 * X3 + 0.6 * X4 + 1.0 * X5;
}

/**
 * Hitung OCF to Debt Ratio
 * OCF/Debt = Operating Cash Flow / Total Debt × 100
 */
export function calcOCFRatio(operatingCashFlow, totalDebt) {
  if (!totalDebt || totalDebt <= 0) return null;
  return (operatingCashFlow / totalDebt) * 100;
}

/**
 * Hitung Cash Runway (bulan)
 * Runway = Cash / Monthly Burn Rate
 */
export function calcCashRunway(cash, monthlyBurnRate) {
  if (!monthlyBurnRate || monthlyBurnRate <= 0) return null;
  return cash / monthlyBurnRate;
}

/**
 * Hitung angsuran bulanan (PMT)
 * PMT = P × r / (1 - (1+r)^-n)
 */
export function calcMonthlyPayment(principal, annualRate, tenorMonths) {
  if (tenorMonths <= 0) return 0;
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / tenorMonths;
  return (principal * r) / (1 - Math.pow(1 + r, -tenorMonths));
}

/**
 * Hitung semua rasio sekaligus dari input keuangan lengkap
 */
export function computeAllRatios(fin) {
  const {
    revenue = 0, cogs = 0, ebit = 0, netIncome = 0, interestExpense = 0,
    operatingCashFlow = 0, totalAssets = 0, totalLiabilities = 0,
    totalEquity = 0, currentAssets = 0, currentLiabilities = 0,
    cash = 0, inventory = 0, accountsReceivable = 0, accountsPayable = 0,
    workingCapital = 0, retainedEarnings = 0, annualDebtService = 0,
    totalDebt = 0, grossRevenue = 0, collateralValue = 0, loanAmount = 0,
    monthlyBurnRate = 0,
  } = fin;

  return {
    roa:          calcROA(netIncome, totalAssets),
    roe:          calcROE(netIncome, totalEquity),
    npm:          calcNPM(netIncome, revenue),
    gpm:          calcGPM(revenue, cogs),
    currentRatio: calcCurrentRatio(currentAssets, currentLiabilities),
    quickRatio:   calcQuickRatio(currentAssets, inventory, currentLiabilities),
    cashRatio:    calcCashRatio(cash, currentLiabilities),
    der:          calcDER(totalLiabilities, totalEquity),
    dar:          calcDAR(totalLiabilities, totalAssets),
    dscr:         calcDSCR(ebit, annualDebtService),
    icr:          calcICR(ebit, interestExpense),
    dti:          calcDTI(annualDebtService, grossRevenue || revenue),
    assetTurnover:calcAssetTurnover(revenue, totalAssets),
    receivableDays:calcReceivableDays(accountsReceivable, revenue),
    inventoryDays: calcInventoryDays(inventory, cogs),
    payableDays:   calcPayableDays(accountsPayable, cogs),
    ltv:           calcLTV(loanAmount, collateralValue),
    altmanZ:       calcAltmanZ({ workingCapital, retainedEarnings, ebit, equity: totalEquity, totalLiabilities, revenue, totalAssets }),
    ebitMargin:    calcEBITMargin(ebit, revenue),
    ocfRatio:      calcOCFRatio(operatingCashFlow, totalDebt),
    cashRunway:    calcCashRunway(cash, monthlyBurnRate),
  };
}
