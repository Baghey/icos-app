export interface CalculatorInputs {
  sellingPrice: number;
  buyingCost: number;
  confirmationRate: number;
  deliveryRate: number;
  callCenterFee: number;
  returnFee: number;
  totalShippingFee: number;
  shippingPayer: "seller" | "customer" | "shared";
  customerShippingContrib: number;
  codPercentage: number;
  packagingFee: number;
  adCurrency: "DZD" | "USD" | "EUR";
  adInputMode: "cpa" | "total";
  adValue: number;
  usdRate: number;
  eurRate: number;
  totalLeads: number;
}

export interface CalculatorResult {
  leads: number;
  confirmedOrders: number;
  deliveredOrders: number;
  returnedOrders: number;
  totalAdSpendDZD: number;
  cpaPerLeadDZD: number;
  cpaPerLeadUSD: number;
  cpaPerDeliveredDZD: number;
  totalRevenue: number;
  totalBuyingCost: number;
  totalShippingCostSeller: number;
  totalReturnCost: number;
  totalCallCenterCost: number;
  totalPackagingCost: number;
  totalCodFee: number;
  totalOpsCost: number;
  netProfitTotal: number;
  netProfitPerDelivered: number;
  netProfitPerLead: number;
  profitMargin: number;
  breakEvenCpaLeadDZD: number;
  breakEvenCpaLeadUSD: number;
  breakEvenSellingPrice: number;
  suggestedSellingPrice: number;
  totalCostPerUnitDelivered: number;
  status: 'good' | 'warning' | 'bad' | 'neutral';
}

export function calculateProfit(input: CalculatorInputs): CalculatorResult {
  const leads = Math.max(1, Number(input.totalLeads) || 1);
  const confRate = (Number(input.confirmationRate) || 0) / 100;
  const delivRate = (Number(input.deliveryRate) || 0) / 100;

  const confirmedOrders = leads * confRate;
  const deliveredOrders = confirmedOrders * delivRate;
  const returnedOrders = Math.max(0, confirmedOrders - deliveredOrders);

  let exchangeRate = 1;
  if (input.adCurrency === 'USD') exchangeRate = Number(input.usdRate) || 1;
  if (input.adCurrency === 'EUR') exchangeRate = Number(input.eurRate) || 1;

  let totalAdSpendDZD = 0;
  let cpaPerLeadDZD = 0;

  if (input.adInputMode === 'cpa') {
    cpaPerLeadDZD = (Number(input.adValue) || 0) * exchangeRate;
    totalAdSpendDZD = leads * cpaPerLeadDZD;
  } else {
    const rawTotal = Number(input.adValue) || 0;
    totalAdSpendDZD = rawTotal * exchangeRate;
    cpaPerLeadDZD = totalAdSpendDZD / leads;
  }

  const cpaPerLeadUSD = cpaPerLeadDZD / (Number(input.usdRate) || 1);
  const cpaPerDeliveredDZD = deliveredOrders > 0 ? totalAdSpendDZD / deliveredOrders : 0;

  let sellerShippingCostPerDelivered = 0;
  const effectiveRevenuePerUnit = Number(input.sellingPrice) || 0;

  if (input.shippingPayer === 'seller') {
    sellerShippingCostPerDelivered = Number(input.totalShippingFee) || 0;
  } else if (input.shippingPayer === 'customer') {
    sellerShippingCostPerDelivered = 0;
  } else if (input.shippingPayer === 'shared') {
    const contrib = Number(input.customerShippingContrib) || 0;
    sellerShippingCostPerDelivered = Math.max(0, (Number(input.totalShippingFee) || 0) - contrib);
  }

  const totalRevenue = deliveredOrders * effectiveRevenuePerUnit;

  const codFeePerUnit = effectiveRevenuePerUnit * ((Number(input.codPercentage) || 0) / 100);
  const totalCodFee = deliveredOrders * codFeePerUnit;

  const totalShippingCostSeller = deliveredOrders * sellerShippingCostPerDelivered;
  const totalBuyingCost = deliveredOrders * (Number(input.buyingCost) || 0);
  const totalReturnCost = returnedOrders * (Number(input.returnFee) || 0);
  const totalCallCenterCost = confirmedOrders * (Number(input.callCenterFee) || 0);
  const totalPackagingCost = confirmedOrders * (Number(input.packagingFee) || 0);

  const totalOpsCost = totalBuyingCost + totalShippingCostSeller + totalReturnCost + totalCallCenterCost + totalPackagingCost + totalCodFee;

  const grossProfitBeforeAds = totalRevenue - totalOpsCost;
  const netProfitTotal = grossProfitBeforeAds - totalAdSpendDZD;
  
  const netProfitPerDelivered = deliveredOrders > 0 ? netProfitTotal / deliveredOrders : 0;
  const netProfitPerLead = netProfitTotal / leads;
  
  const profitMargin = totalRevenue > 0 ? (netProfitTotal / totalRevenue) * 100 : 0;

  const breakEvenCpaLeadDZD = grossProfitBeforeAds / leads;
  const breakEvenCpaLeadUSD = breakEvenCpaLeadDZD / (Number(input.usdRate) || 1);

  const codPct = (Number(input.codPercentage) || 0) / 100;
  const totalFixedOps = totalBuyingCost + totalShippingCostSeller + totalReturnCost + totalCallCenterCost + totalPackagingCost + totalAdSpendDZD;
  const breakEvenSellingPrice = (deliveredOrders > 0 && (1 - codPct) > 0)
    ? (totalFixedOps / deliveredOrders) / (1 - codPct)
    : 0;

  // Calcul mathématiquement exact pour le Target Margin (25%)
  const targetMargin = 0.25;
  let suggestedSellingPrice = 0;
  const marginDenominator = 1 - targetMargin - codPct;
  if (deliveredOrders > 0 && marginDenominator > 0) {
      suggestedSellingPrice = totalFixedOps / (deliveredOrders * marginDenominator);
  }

  const totalCostPerUnitDelivered = deliveredOrders > 0 ? (totalOpsCost + totalAdSpendDZD) / deliveredOrders : 0;

  let status: 'good' | 'warning' | 'bad' | 'neutral' = 'neutral';
  if (totalRevenue === 0 || leads === 0) {
    status = 'neutral';
  } else if (netProfitTotal < 0) {
    status = 'bad';
  } else if (profitMargin < 15) {
    status = 'warning';
  } else {
    status = 'good';
  }

  return {
    leads,
    confirmedOrders,
    deliveredOrders,
    returnedOrders,
    totalAdSpendDZD,
    cpaPerLeadDZD,
    cpaPerLeadUSD,
    cpaPerDeliveredDZD,
    totalRevenue,
    totalBuyingCost,
    totalShippingCostSeller,
    totalReturnCost,
    totalCallCenterCost,
    totalPackagingCost,
    totalCodFee,
    totalOpsCost,
    netProfitTotal,
    netProfitPerDelivered,
    netProfitPerLead,
    profitMargin,
    breakEvenCpaLeadDZD,
    breakEvenCpaLeadUSD,
    breakEvenSellingPrice,
    suggestedSellingPrice,
    totalCostPerUnitDelivered,
    status
  };
}
