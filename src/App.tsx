import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Truck,
  RotateCcw,
  PhoneCall,
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Info,
  RefreshCw,
  Calculator,
  ArrowRight,
  Share2,
  Copy,
  Check,
  Percent,
  Sliders,
  BarChart3,
  Globe,
  Zap,
  ShieldAlert,
  Sparkles,
  Layers
} from 'lucide-react';

import KillScaleTab from './components/KillScaleTab';
import MarketingTab from './components/MarketingTab';

export default function App() {
  // --- Language State ---
  const [lang, setLang] = useState('fr'); // 'fr' or 'ar'
  const [activeTab, setActiveTab] = useState<'calculator' | 'kill-scale' | 'marketing'>('calculator');

  // --- Form Inputs State ---
  const [sellingPrice, setSellingPrice] = useState(6000); // Prix de vente (DZD)
  const [buyingCost, setBuyingCost] = useState(2000); // Prix d'achat COGS (DZD)
  const [confirmationRate, setConfirmationRate] = useState(70); // Taux de confirmation %
  const [deliveryRate, setDeliveryRate] = useState(50); // Taux de livraison %
  const [callCenterFee, setCallCenterFee] = useState(120); // Frais Call Center par commande confirmée (DZD)
  const [returnFee, setReturnFee] = useState(250); // Frais de retour par colis non livré (DZD)
  const [totalShippingFee, setTotalShippingFee] = useState(700); // Frais de livraison totaux (DZD)
  
  // Who pays shipping: 'seller' (Vous payez), 'customer' (Le client paie), 'shared' (Partagé)
  const [shippingPayer, setShippingPayer] = useState('seller'); 
  const [customerShippingContrib, setCustomerShippingContrib] = useState(300); // Contribution client si partagé
  
  const [codPercentage, setCodPercentage] = useState(2); // Commission COD %
  const [extraFee, setExtraFee] = useState(0); // Frais emballage / extra par commande (DZD)
  
  // Ad Spend Parameters
  const [adCurrency, setAdCurrency] = useState('USD'); // 'DZD', 'USD', 'EUR'
  const [adInputMode, setAdInputMode] = useState('cpa'); // 'cpa' (CPA par Lead) or 'total' (Budget Pub Total)
  const [adValue, setAdValue] = useState(2.5); // Si CPA: 2.5$ par lead. Si total: montant global.
  
  // Exchange Rates (Market Rates)
  const [usdRate, setUsdRate] = useState(240); // Taux USDT/USD Square
  const [eurRate, setEurRate] = useState(245); // Taux Euro Square
  
  // Volume
  const [totalLeads, setTotalLeads] = useState(100); // Nombre de leads totaux

  // Notification Copy
  const [copied, setCopied] = useState(false);

  // Preset Selector
  const applyPreset = (preset: string) => {
    if (preset === 'gadget') {
      setSellingPrice(3800);
      setBuyingCost(1200);
      setConfirmationRate(65);
      setDeliveryRate(55);
      setCallCenterFee(100);
      setReturnFee(200);
      setTotalShippingFee(700);
      setShippingPayer('customer');
      setCustomerShippingContrib(600);
      setAdCurrency('USD');
      setAdInputMode('cpa');
      setAdValue(1.8);
      setTotalLeads(100);
    } else if (preset === 'high_ticket') {
      setSellingPrice(12500);
      setBuyingCost(4500);
      setConfirmationRate(75);
      setDeliveryRate(65);
      setCallCenterFee(200);
      setReturnFee(300);
      setTotalShippingFee(800);
      setShippingPayer('seller');
      setCustomerShippingContrib(0);
      setAdCurrency('USD');
      setAdInputMode('cpa');
      setAdValue(4.5);
      setTotalLeads(50);
    } else if (preset === 'standard') {
      setSellingPrice(6000);
      setBuyingCost(2000);
      setConfirmationRate(70);
      setDeliveryRate(50);
      setCallCenterFee(120);
      setReturnFee(250);
      setTotalShippingFee(700);
      setShippingPayer('seller');
      setCustomerShippingContrib(300);
      setAdCurrency('USD');
      setAdInputMode('cpa');
      setAdValue(2.5);
      setTotalLeads(100);
    }
  };

  // Reset to initial
  const resetForm = () => {
    applyPreset('standard');
  };

  // --- Calculations ---
  const calc = useMemo(() => {
    const leads = Math.max(1, Number(totalLeads) || 1);
    const confRate = (Number(confirmationRate) || 0) / 100;
    const delivRate = (Number(deliveryRate) || 0) / 100;

    // Commandes
    const confirmedOrders = leads * confRate;
    const deliveredOrders = confirmedOrders * delivRate;
    const returnedOrders = Math.max(0, confirmedOrders - deliveredOrders);

    // Calcul du taux d'échange effectif
    let exchangeRate = 1;
    if (adCurrency === 'USD') exchangeRate = Number(usdRate) || 1;
    if (adCurrency === 'EUR') exchangeRate = Number(eurRate) || 1;

    // Calcul des dépenses publicitaires totales en DZD
    let totalAdSpendDZD = 0;
    let cpaPerLeadDZD = 0;

    if (adInputMode === 'cpa') {
      cpaPerLeadDZD = (Number(adValue) || 0) * exchangeRate;
      totalAdSpendDZD = leads * cpaPerLeadDZD;
    } else {
      const rawTotal = Number(adValue) || 0;
      totalAdSpendDZD = rawTotal * exchangeRate;
      cpaPerLeadDZD = totalAdSpendDZD / leads;
    }

    const cpaPerLeadUSD = cpaPerLeadDZD / (Number(usdRate) || 1);
    const cpaPerDeliveredDZD = deliveredOrders > 0 ? totalAdSpendDZD / deliveredOrders : 0;

    // Livraison payée par le vendeur par commande livrée
    let sellerShippingCostPerDelivered = 0;
    let effectiveRevenuePerUnit = Number(sellingPrice) || 0;

    if (shippingPayer === 'seller') {
      sellerShippingCostPerDelivered = Number(totalShippingFee) || 0;
    } else if (shippingPayer === 'customer') {
      sellerShippingCostPerDelivered = 0; // Le client paie tout le shipping
    } else if (shippingPayer === 'shared') {
      const contrib = Number(customerShippingContrib) || 0;
      sellerShippingCostPerDelivered = Math.max(0, (Number(totalShippingFee) || 0) - contrib);
    }

    // Chiffre d'Affaires Brut Collected
    const totalRevenue = deliveredOrders * effectiveRevenuePerUnit;

    // Frais COD
    const codFeePerUnit = effectiveRevenuePerUnit * ((Number(codPercentage) || 0) / 100);
    const totalCodFee = deliveredOrders * codFeePerUnit;

    // Frais de livraison seller total
    const totalShippingCostSeller = deliveredOrders * sellerShippingCostPerDelivered;

    // Coût d'achat total (uniquement pour les colis livrés)
    const totalBuyingCost = deliveredOrders * (Number(buyingCost) || 0);

    // Frais de retour totaux
    const totalReturnCost = returnedOrders * (Number(returnFee) || 0);

    // Frais Call Center totaux (sur commandes confirmées)
    const totalCallCenterCost = confirmedOrders * (Number(callCenterFee) || 0);

    // Frais annexes/emballage totaux (sur commandes confirmées)
    const totalExtraCost = confirmedOrders * (Number(extraFee) || 0);

    // Coût opérationnel Total (hors pub)
    const totalOpsCost = totalBuyingCost + totalShippingCostSeller + totalReturnCost + totalCallCenterCost + totalExtraCost + totalCodFee;

    // Bénéfice Brut Avant Pub
    const grossProfitBeforeAds = totalRevenue - totalOpsCost;

    // Bénéfice Net Total
    const netProfitTotal = grossProfitBeforeAds - totalAdSpendDZD;

    // Bénéfice Net Par Unité Livrée
    const netProfitPerDelivered = deliveredOrders > 0 ? netProfitTotal / deliveredOrders : 0;

    // Bénéfice Net Par Lead
    const netProfitPerLead = netProfitTotal / leads;

    // Marge nette (%) = (Bénéfice Net / Chiffre d'Affaires) * 100
    const profitMargin = totalRevenue > 0 ? (netProfitTotal / totalRevenue) * 100 : 0;

    // --- Break-even Calculations ---
    // Break-even CPA per Lead (DZD) = Gross Profit Before Ads Total / Total Leads
    const breakEvenCpaLeadDZD = grossProfitBeforeAds / leads;
    const breakEvenCpaLeadUSD = breakEvenCpaLeadDZD / (Number(usdRate) || 1);

    // Break-even Selling Price (Prix d'équilibre pour que le résultat net soit égal à 0)
    // Formula: Total Revenue = Total Ops (sans le COD variant) + AdSpend
    // Let P = selling price
    // Revenue = N_liv * P
    // COD = N_liv * P * (cod%)
    // N_liv * P * (1 - cod%) = BuyingTotal + ShipTotal + ReturnTotal + CallCenterTotal + ExtraTotal + AdSpendTotal
    const codPct = (Number(codPercentage) || 0) / 100;
    const totalFixedOps = totalBuyingCost + totalShippingCostSeller + totalReturnCost + totalCallCenterCost + totalExtraCost + totalAdSpendDZD;
    const breakEvenSellingPrice = (deliveredOrders > 0 && (1 - codPct) > 0)
      ? (totalFixedOps / deliveredOrders) / (1 - codPct)
      : 0;

    // Prix suggéré pour avoir 25% de marge nette
    // NetProfit / Revenue = 25% => Revenue * 0.75 - Ops = 0
    const suggestedSellingPrice = breakEvenSellingPrice > 0 ? breakEvenSellingPrice * 1.35 : 0;

    // Coût Total Unitaire par Colis Livré (Toutes charges comprises incluant pub amortie)
    const totalCostPerUnitDelivered = deliveredOrders > 0 ? (totalOpsCost + totalAdSpendDZD) / deliveredOrders : 0;

    // Évaluation du produit (Status & Advice)
    let status = 'neutral';
    let statusLabel = lang === 'fr' ? 'En attente...' : 'بانتظار الإدخال';
    let advice = '';

    if (totalRevenue === 0 || leads === 0) {
      status = 'neutral';
      statusLabel = lang === 'fr' ? 'Saisissez vos données' : 'أدخل المعطيات';
      advice = lang === 'fr' 
        ? 'Ajustez le prix de vente et les coûts pour obtenir une analyse détaillée.'
        : 'أدخل سعر البيع والتكاليف الأساسية للحصول على قرار واضح.';
    } else if (netProfitTotal < 0) {
      status = 'bad';
      statusLabel = lang === 'fr' ? 'NON RENTABLE (PERTE)' : 'غير مربح (خسارة)';
      advice = lang === 'fr'
        ? `Votre CPA actuel (${cpaPerLeadUSD.toFixed(2)}$) dépasse le seuil d'équilibre (${breakEvenCpaLeadUSD.toFixed(2)}$). Réduisez le coût d'acquisition ou augmentez le prix à au moins ${Math.round(breakEvenSellingPrice)} DZD.`
        : `تكلفة الإعلان للطلب (${cpaPerLeadUSD.toFixed(2)}$) تتجاوز حد التعادل (${breakEvenCpaLeadUSD.toFixed(2)}$). يرجى خفض CPA أو رفع سعر البيع إلى ${Math.round(breakEvenSellingPrice)} دج على الأقل.`;
    } else if (profitMargin < 15) {
      status = 'warning';
      statusLabel = lang === 'fr' ? 'RISQUÉ (MARGE FAIBLE)' : 'مخاطرة (هامش ضعيف)';
      advice = lang === 'fr'
        ? `Marge de ${profitMargin.toFixed(1)}% est fragile. Un taux de livraison faible pourrait vous faire passer dans le rouge. Ciblez un prix de ${Math.round(suggestedSellingPrice)} DZD.`
        : `هامش الربح ${profitMargin.toFixed(1)}% ضعيف ومعرّض للخسارة في حال انخفاض التسليم. يُفضل رفع السعر إلى ${Math.round(suggestedSellingPrice)} دج.`;
    } else {
      status = 'good';
      statusLabel = lang === 'fr' ? 'EXCELLENT / RENTABLE' : 'منتج ممتاز ومربح';
      advice = lang === 'fr'
        ? `Excellente opportunité ! Vous dégagez ${Math.round(netProfitPerDelivered)} DZD net par produit livré (${profitMargin.toFixed(1)}% de marge). Vous pouvez scaler.`
        : `فرصة ممتازة! تحقق صافي ربح ${Math.round(netProfitPerDelivered)} دج لكل طلبية مسلمة (هامش ${profitMargin.toFixed(1)}%). يمكنك البدء والتكبير.`;
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
      totalExtraCost,
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
      status,
      statusLabel,
      advice
    };
  }, [
    totalLeads, confirmationRate, deliveryRate, sellingPrice, buyingCost,
    callCenterFee, returnFee, totalShippingFee, shippingPayer, customerShippingContrib,
    codPercentage, extraFee, adCurrency, adInputMode, adValue, usdRate, eurRate, lang
  ]);

  // Copy Summary to Clipboard
  const copySummary = () => {
    const text = lang === 'fr' ? 
`📊 RAPPORT DE RENTABILITÉ ECOM COD:
• Prix de Vente: ${sellingPrice} DZD
• Coût Produit: ${buyingCost} DZD
• Taux Confirmation: ${confirmationRate}% | Livraison: ${deliveryRate}%
• CPA par Lead: ${calc.cpaPerLeadUSD.toFixed(2)}$ (${Math.round(calc.cpaPerLeadDZD)} DZD)
----------------------------------
🎯 CPA Break-Even Max: ${calc.breakEvenCpaLeadUSD.toFixed(2)}$ (${Math.round(calc.breakEvenCpaLeadDZD)} DZD)
💰 Prix d'Équilibre: ${Math.round(calc.breakEvenSellingPrice)} DZD
📈 Bénéfice Net Total: ${Math.round(calc.netProfitTotal)} DZD
💎 Bénéfice Net / Colis Livré: ${Math.round(calc.netProfitPerDelivered)} DZD
📊 Marge Nette: ${calc.profitMargin.toFixed(1)}%
Verdict: ${calc.statusLabel}` :

`📊 تقرير ربحية التجارة الإلكترونية COD:
• سعر البيع: ${sellingPrice} دج
• سعر الشراء: ${buyingCost} دج
• نسبة التأكيد: ${confirmationRate}% | التسليم: ${deliveryRate}%
• تكلفة الإعلان/طلب: ${calc.cpaPerLeadUSD.toFixed(2)}$ (${Math.round(calc.cpaPerLeadDZD)} دج)
----------------------------------
🎯 سعر التعادل CPA الأقصى: ${calc.breakEvenCpaLeadUSD.toFixed(2)}$ (${Math.round(calc.breakEvenCpaLeadDZD)} دج)
💰 سعر البيع للتعادل: ${Math.round(calc.breakEvenSellingPrice)} دج
📈 صافي الربح الإجمالي: ${Math.round(calc.netProfitTotal)} دج
💎 صافي الربح/قطعة مسلمة: ${Math.round(calc.netProfitPerDelivered)} دج
📊 هامش الربح الصافي: ${calc.profitMargin.toFixed(1)}%
القرار: ${calc.statusLabel}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const isRtl = lang === 'ar';

  return (
    <div className={`min-h-screen bg-[#0a0c10] text-slate-100 font-sans antialiased pb-12 selection:bg-orange-500 selection:text-white ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#0d0f14]/90 backdrop-blur-md border-b border-slate-800">
        <div className="px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-white leading-tight flex items-center gap-2">
                  ICOS <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full font-mono">PRO</span>
                </h1>
                <p className="text-xs text-slate-400">
                  {lang === 'fr' ? 'Calculateur de Marge & Seuil' : 'حاسبة الربحية وسعر التعادل'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              >
                <Globe className="w-3.5 h-3.5 text-orange-400" />
                <span>{lang === 'fr' ? 'العربية' : 'Français'}</span>
              </button>

              <button
                onClick={copySummary}
                className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-md shadow-orange-600/20"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? (lang === 'fr' ? 'Copié !' : 'تم النسخ!') : (lang === 'fr' ? 'Copier' : 'نسخ')}</span>
              </button>
            </div>
          </div>
        </div>
        <div className="flex overflow-x-auto border-t border-slate-800/80 px-2 hide-scrollbar">
          <div className="flex max-w-7xl mx-auto w-full space-x-1">
            <button 
              onClick={() => setActiveTab('calculator')}
              className={`whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'calculator' ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
            >
              🧮 {lang === 'fr' ? 'Calculatrice' : 'الآلة الحاسبة'}
            </button>
            <button 
              onClick={() => setActiveTab('kill-scale')}
              className={`whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'kill-scale' ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
            >
              ⚖️ Kill or Scale
            </button>
            <button 
              onClick={() => setActiveTab('marketing')}
              className={`whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'marketing' ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
            >
              💡 Marketing (IA)
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 pt-6">

        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-500">
            {/* LEFT COLUMN: Quick Decision Dashboard & Output Analytics (Cols 1 to 5) */}
            <div className="lg:col-span-5 space-y-6">

              {/* Quick Decision Card (القرار السريع) */}
              <div className="bg-[#12151c] border border-slate-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-400" />
                    <h2 className="font-bold text-sm text-slate-200 uppercase tracking-wider">
                      {lang === 'fr' ? 'Décision Rapide' : 'القرار السريع'}
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    COD DZ Engine
                  </span>
                </div>

                {/* Product Status Verdict Box */}
                <div className={`rounded-xl p-4 mb-4 border transition-all ${
                  calc.status === 'good'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : calc.status === 'warning'
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                    : calc.status === 'bad'
                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}>
                  <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">
                    {lang === 'fr' ? 'Verdict Produit' : 'قرار المنتج'}
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold flex items-center justify-between">
                    <span>{calc.statusLabel}</span>
                    {calc.status === 'good' && <CheckCircle2 className="w-7 h-7 text-emerald-400" />}
                    {calc.status === 'warning' && <AlertTriangle className="w-7 h-7 text-amber-400" />}
                    {calc.status === 'bad' && <XCircle className="w-7 h-7 text-rose-400" />}
                    {calc.status === 'neutral' && <HelpCircle className="w-7 h-7 text-slate-500" />}
                  </div>
                </div>

                {/* Profit & Margin Indicators */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-[#181c26] border border-slate-800 rounded-xl p-3.5">
                    <div className="text-xs text-slate-400 mb-1">
                      {lang === 'fr' ? 'Bénéfice Net / Colis' : 'الربح الصافي للوحدة'}
                    </div>
                    <div className={`text-xl font-bold font-mono ${calc.netProfitPerDelivered >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {Math.round(calc.netProfitPerDelivered).toLocaleString()} <span className="text-xs font-normal">DZD</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      ~ {(calc.netProfitPerDelivered / (usdRate || 1)).toFixed(2)} $ USDT
                    </div>
                  </div>

                  <div className="bg-[#181c26] border border-slate-800 rounded-xl p-3.5">
                    <div className="text-xs text-slate-400 mb-1">
                      {lang === 'fr' ? 'Marge Nette' : 'هامش الربح'}
                    </div>
                    <div className={`text-xl font-bold font-mono ${calc.profitMargin >= 20 ? 'text-emerald-400' : calc.profitMargin > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {calc.profitMargin.toFixed(1)} %
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {lang === 'fr' ? 'Sur chiffre d\'affaires' : 'من إجمالي المداخيل'}
                    </div>
                  </div>
                </div>

                {/* Margin Strength Gauge */}
                <div className="bg-[#181c26] border border-slate-800 rounded-xl p-3.5 mb-4">
                  <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5">
                    <span>{lang === 'fr' ? 'Force de la Marge' : 'قوة الهامش'}</span>
                    <span className="font-mono font-semibold text-slate-200">{Math.max(0, Math.min(100, Math.round(calc.profitMargin * 2)))}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        calc.profitMargin >= 25
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : calc.profitMargin >= 12
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                          : 'bg-gradient-to-r from-rose-600 to-red-500'
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, calc.profitMargin * 2))}%` }}
                    />
                  </div>
                </div>

                {/* Smart Advice Box */}
                <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5 mb-4 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide mb-0.5">
                      {lang === 'fr' ? 'Conseil Intelligent' : 'نصيحة ذكية'}
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {calc.advice}
                    </p>
                  </div>
                </div>

                {/* Break-even & Target Price Comparison */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                  <div className="bg-[#161a24] p-3 rounded-lg border border-slate-800">
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Info className="w-3 h-3 text-slate-400" />
                      <span>{lang === 'fr' ? 'Prix d\'Équilibre' : 'سعر التعادل'}</span>
                    </div>
                    <div className="text-base font-bold font-mono text-slate-200 mt-0.5">
                      {Math.round(calc.breakEvenSellingPrice).toLocaleString()} DZD
                    </div>
                    <div className="text-[10px] text-slate-500">{lang === 'fr' ? 'Prix min (Profit = 0)' : 'أدنى سعر لتفادي الخسارة'}</div>
                  </div>

                  <div className="bg-[#161a24] p-3 rounded-lg border border-slate-800">
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-orange-400" />
                      <span>{lang === 'fr' ? 'Prix Suggéré' : 'السعر المقترح'}</span>
                    </div>
                    <div className="text-base font-bold font-mono text-orange-400 mt-0.5">
                      {Math.round(calc.suggestedSellingPrice).toLocaleString()} DZD
                    </div>
                    <div className="text-[10px] text-slate-500">{lang === 'fr' ? 'Pour 25%+ de marge' : 'لتحقيق هامش 25%+'}</div>
                  </div>
                </div>
              </div>

              {/* Full Analytical Metrics Breakdown (عرض التفاصيل الكاملة) */}
              <div className="bg-[#12151c] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-orange-400" />
                    <h2 className="font-bold text-sm text-slate-200 uppercase tracking-wider">
                      {lang === 'fr' ? 'Métriques & Détails' : 'عرض التفاصيل الكاملة'}
                    </h2>
                  </div>
                  <span className="text-xs text-slate-400">
                    {calc.leads} Leads
                  </span>
                </div>

                {/* Target Break-even CPA Highlight */}
                <div className="bg-gradient-to-r from-orange-950/40 via-amber-950/20 to-slate-900 border border-orange-500/30 rounded-xl p-4 mb-4">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs text-orange-300 font-semibold uppercase tracking-wider">
                      🎯 {lang === 'fr' ? 'CPA Break-Even Max (Par Lead)' : 'أقصى تكلفة إعلان للطلب (CPA التعادل)'}
                    </span>
                    <span className="text-[11px] bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded font-mono">
                      {lang === 'fr' ? 'Plafond Pub' : 'حد الإعلان'}
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold font-mono text-white flex items-baseline gap-2 mt-1">
                    <span>{calc.breakEvenCpaLeadUSD.toFixed(2)} $</span>
                    <span className="text-sm text-slate-400 font-normal">
                      ({Math.round(calc.breakEvenCpaLeadDZD).toLocaleString()} DZD)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-normal">
                    {lang === 'fr'
                      ? `Si votre CPA dépasse ${calc.breakEvenCpaLeadUSD.toFixed(2)}$, la campagne devient déficitaire.`
                      : `إذا تجاوزت تكلفة الحصول على الطلب ${calc.breakEvenCpaLeadUSD.toFixed(2)}$ ستصبح الحملة خاسرة.`}
                  </p>
                </div>

                {/* Detailed Key Value Grid */}
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="bg-[#171b24] p-3 rounded-lg border border-slate-800">
                    <div className="text-slate-400">{lang === 'fr' ? 'Commandes Confirmées' : 'عدد الطلبات المؤكدة'}</div>
                    <div className="text-base font-bold font-mono text-slate-100 mt-0.5">
                      {calc.confirmedOrders.toFixed(1)} <span className="text-xs font-normal text-slate-500">({confirmationRate}%)</span>
                    </div>
                  </div>

                  <div className="bg-[#171b24] p-3 rounded-lg border border-slate-800">
                    <div className="text-slate-400">{lang === 'fr' ? 'Commandes Livrées' : 'عدد الطلبات المسلمة'}</div>
                    <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                      {calc.deliveredOrders.toFixed(1)} <span className="text-xs font-normal text-slate-500">({deliveryRate}%)</span>
                    </div>
                  </div>

                  <div className="bg-[#171b24] p-3 rounded-lg border border-slate-800">
                    <div className="text-slate-400">{lang === 'fr' ? 'Colis Retournés' : 'عدد الطلبات الملغاة/المرتجعة'}</div>
                    <div className="text-base font-bold font-mono text-rose-400 mt-0.5">
                      {calc.returnedOrders.toFixed(1)}
                    </div>
                  </div>

                  <div className="bg-[#171b24] p-3 rounded-lg border border-slate-800">
                    <div className="text-slate-400">{lang === 'fr' ? 'CPA / Colis Livré' : 'تكلفة الإعلان لكل طلبية مسلمة'}</div>
                    <div className="text-base font-bold font-mono text-slate-100 mt-0.5">
                      {Math.round(calc.cpaPerDeliveredDZD).toLocaleString()} DZD
                    </div>
                  </div>

                  <div className="bg-[#171b24] p-3 rounded-lg border border-slate-800">
                    <div className="text-slate-400">{lang === 'fr' ? 'Coût Total / Unité Livrée' : 'التكلفة الإجمالية للوحدة'}</div>
                    <div className="text-base font-bold font-mono text-slate-100 mt-0.5">
                      {Math.round(calc.totalCostPerUnitDelivered).toLocaleString()} DZD
                    </div>
                  </div>

                  <div className="bg-[#171b24] p-3 rounded-lg border border-slate-800">
                    <div className="text-slate-400">{lang === 'fr' ? 'Chiffre d\'Affaires Total' : 'إجمالي الإيرادات'}</div>
                    <div className="text-base font-bold font-mono text-slate-100 mt-0.5">
                      {Math.round(calc.totalRevenue).toLocaleString()} DZD
                    </div>
                  </div>

                  <div className="col-span-2 bg-[#171b24] p-3.5 rounded-lg border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-slate-400">{lang === 'fr' ? 'Bénéfice Net Total' : 'إجمالي الربح الصافي'}</div>
                      <div className="text-xs text-slate-500">Pour {calc.leads} leads totaux</div>
                    </div>
                    <div className={`text-xl font-black font-mono ${calc.netProfitTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {Math.round(calc.netProfitTotal).toLocaleString()} DZD
                    </div>
                  </div>
                </div>

                {/* Cost Visual Stacked Bar */}
                {calc.totalRevenue > 0 && (
                  <div className="mt-5 pt-4 border-t border-slate-800">
                    <div className="text-xs text-slate-400 mb-2 flex justify-between">
                      <span>{lang === 'fr' ? 'Répartition des Coûts' : 'توزيع المصاريف'}</span>
                      <span>100% Chiffre d'Affaires</span>
                    </div>

                    <div className="h-4 w-full bg-slate-800 rounded-md overflow-hidden flex text-[10px] font-mono">
                      {/* COGS */}
                      <div
                        style={{ width: `${Math.min(100, (calc.totalBuyingCost / calc.totalRevenue) * 100)}%` }}
                        className="bg-blue-500 h-full"
                        title={`Achat: ${Math.round(calc.totalBuyingCost)} DZD`}
                      />
                      {/* Pub */}
                      <div
                        style={{ width: `${Math.min(100, (calc.totalAdSpendDZD / calc.totalRevenue) * 100)}%` }}
                        className="bg-purple-500 h-full"
                        title={`Pub: ${Math.round(calc.totalAdSpendDZD)} DZD`}
                      />
                      {/* Shipping & Returns */}
                      <div
                        style={{ width: `${Math.min(100, ((calc.totalShippingCostSeller + calc.totalReturnCost) / calc.totalRevenue) * 100)}%` }}
                        className="bg-amber-500 h-full"
                        title={`Livraison & Retour: ${Math.round(calc.totalShippingCostSeller + calc.totalReturnCost)} DZD`}
                      />
                      {/* Call Center & Extra */}
                      <div
                        style={{ width: `${Math.min(100, ((calc.totalCallCenterCost + calc.totalExtraCost + calc.totalCodFee) / calc.totalRevenue) * 100)}%` }}
                        className="bg-teal-500 h-full"
                        title={`Call Center / Extra / COD: ${Math.round(calc.totalCallCenterCost + calc.totalExtraCost + calc.totalCodFee)} DZD`}
                      />
                      {/* Net Profit */}
                      {calc.netProfitTotal > 0 && (
                        <div
                          style={{ width: `${Math.min(100, (calc.netProfitTotal / calc.totalRevenue) * 100)}%` }}
                          className="bg-emerald-500 h-full"
                          title={`Bénéfice Net: ${Math.round(calc.netProfitTotal)} DZD`}
                        />
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Achat</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> Pub</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Livraison & Retour</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500 inline-block" /> Call Center/COD</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Profit</span>
                    </div>
                  </div>
                )}

              </div>

            </div>

            {/* RIGHT COLUMN: Full Form Inputs & Controls (Cols 6 to 12) */}
            <div className="lg:col-span-7 space-y-6">

              {/* Form Box (المعطيات) */}
              <div className="bg-[#12151c] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between mb-5 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-orange-400" />
                    <h2 className="font-bold text-sm text-slate-200 uppercase tracking-wider">
                      {lang === 'fr' ? 'Paramètres du Produit & Campagne' : 'المعطيات والتكاليف'}
                    </h2>
                  </div>
                  <button
                    onClick={resetForm}
                    className="text-xs text-slate-400 hover:text-orange-400 flex items-center gap-1 transition-all"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{lang === 'fr' ? 'Réinitialiser' : 'إعادة التصفير'}</span>
                  </button>
                </div>

                <div className="space-y-4">

                  {/* SECTION 1: Product Pricing & COGS */}
                  <div className="bg-[#161a24] p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Package className="w-4 h-4" />
                      <span>{lang === 'fr' ? '1. Prix & Coût Produit' : '1. سعر البيع والشراء'}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-300 mb-1 font-medium">
                          {lang === 'fr' ? 'Suel de Vente (DZD)' : 'سعر بيع المنتج (دج)'}
                        </label>
                        <input
                          type="number"
                          value={sellingPrice}
                          onChange={(e) => setSellingPrice(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg px-3 py-2 text-sm font-mono text-white outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-300 mb-1 font-medium">
                          {lang === 'fr' ? 'Coût d\'Achat COGS (DZD)' : 'سعر شراء المنتج (دج)'}
                        </label>
                        <input
                          type="number"
                          value={buyingCost}
                          onChange={(e) => setBuyingCost(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg px-3 py-2 text-sm font-mono text-white outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: Conversion & Funnel Rates */}
                  <div className="bg-[#161a24] p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Percent className="w-4 h-4" />
                      <span>{lang === 'fr' ? '2. Taux de Conversion & Funnel' : '2. نسب التأكيد والتسليم'}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Confirmation Rate Slider */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs text-slate-300 font-medium">
                            {lang === 'fr' ? 'Taux de Confirmation (%)' : 'نسبة التأكيد (%)'}
                          </label>
                          <span className="text-xs font-mono font-bold text-orange-400">{confirmationRate}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={confirmationRate}
                          onChange={(e) => setConfirmationRate(Number(e.target.value))}
                          className="w-full accent-orange-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                        />
                        <div className="text-[10px] text-slate-500 mt-1">
                          {lang === 'fr' ? 'Moyenne Algérie: 60% - 75%' : 'المعدل في الجزائر: 60% - 75%'}
                        </div>
                      </div>

                      {/* Delivery Rate Slider */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs text-slate-300 font-medium">
                            {lang === 'fr' ? 'Taux de Livraison (%)' : 'نسبة التسليم (%)'}
                          </label>
                          <span className="text-xs font-mono font-bold text-emerald-400">{deliveryRate}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={deliveryRate}
                          onChange={(e) => setDeliveryRate(Number(e.target.value))}
                          className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                        />
                        <div className="text-[10px] text-slate-500 mt-1">
                          {lang === 'fr' ? 'Moyenne Algérie: 45% - 65%' : 'المعدل في الجزائر: 45% - 65%'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: Logistics & Operational Costs */}
                  <div className="bg-[#161a24] p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Truck className="w-4 h-4" />
                      <span>{lang === 'fr' ? '3. Logistique & Frais de Livraison' : '3. مصاريف الشحن والروتور'}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-slate-300 mb-1 font-medium">
                          {lang === 'fr' ? 'Frais de Livraison Totaux' : 'تكلفة التوصيل الكاملة'}
                        </label>
                        <input
                          type="number"
                          value={totalShippingFee}
                          onChange={(e) => setTotalShippingFee(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 focus:border-orange-500 rounded-lg px-3 py-2 text-sm font-mono text-white outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-300 mb-1 font-medium">
                          {lang === 'fr' ? 'Qui paie le shipping ?' : 'من يدفع التوصيل؟'}
                        </label>
                        <select
                          value={shippingPayer}
                          onChange={(e) => setShippingPayer(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 focus:border-orange-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                        >
                          <option value="seller">{lang === 'fr' ? 'Vous payez (Livraison gratuite)' : 'أنت تدفع (توصيل مجاني)'}</option>
                          <option value="customer">{lang === 'fr' ? 'Le client paie tout' : 'الزبون يدفع كامل الشحن'}</option>
                          <option value="shared">{lang === 'fr' ? 'Partagé avec le client' : 'مشاركة بين الزبون والبائع'}</option>
                        </select>
                      </div>

                      {shippingPayer === 'shared' && (
                        <div>
                          <label className="block text-xs text-slate-300 mb-1 font-medium">
                            {lang === 'fr' ? 'Contrib. Client (DZD)' : 'مساهمة الزبون (دج)'}
                          </label>
                          <input
                            type="number"
                            value={customerShippingContrib}
                            onChange={(e) => setCustomerShippingContrib(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 focus:border-orange-500 rounded-lg px-3 py-2 text-sm font-mono text-white outline-none"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs text-slate-300 mb-1 font-medium">
                          {lang === 'fr' ? 'Frais de Retour (DZD)' : 'تكلفة الروتور'}
                        </label>
                        <input
                          type="number"
                          value={returnFee}
                          onChange={(e) => setReturnFee(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 focus:border-orange-500 rounded-lg px-3 py-2 text-sm font-mono text-white outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
                      <div>
                        <label className="block text-xs text-slate-300 mb-1 font-medium">
                          {lang === 'fr' ? 'Call Center / Conf (DZD)' : 'تكلفة التأكيد / Call Center'}
                        </label>
                        <input
                          type="number"
                          value={callCenterFee}
                          onChange={(e) => setCallCenterFee(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 focus:border-orange-500 rounded-lg px-3 py-2 text-sm font-mono text-white outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-300 mb-1 font-medium">
                          {lang === 'fr' ? 'Commission COD (%)' : 'نسبة COD لشركة التوصيل'}
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          value={codPercentage}
                          onChange={(e) => setCodPercentage(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 focus:border-orange-500 rounded-lg px-3 py-2 text-sm font-mono text-white outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-300 mb-1 font-medium">
                          {lang === 'fr' ? 'Frais Emballage' : 'مصاريف التغليف'}
                        </label>
                        <input
                          type="number"
                          value={extraFee}
                          onChange={(e) => setExtraFee(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 focus:border-orange-500 rounded-lg px-3 py-2 text-sm font-mono text-white outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 4: Advertising & Currency Settings */}
                  <div className="bg-[#161a24] p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4" />
                      <span>{lang === 'fr' ? '4. Dépenses Publicitaires & Devises' : '4. مصاريف الإعلانات والعملة'}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-slate-300 mb-1 font-medium">
                          {lang === 'fr' ? 'Devise Pub' : 'عملة الإعلان'}
                        </label>
                        <select
                          value={adCurrency}
                          onChange={(e) => setAdCurrency(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 focus:border-orange-500 rounded-lg px-3 py-2 text-xs text-white outline-none font-bold"
                        >
                          <option value="USD">USD ($ USDT)</option>
                          <option value="EUR">EUR (€ Square)</option>
                          <option value="DZD">DZD (دج)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-300 mb-1 font-medium">
                          {lang === 'fr' ? 'Mode d\'entrée Pub' : 'طريقة إدخال الإعلان'}
                        </label>
                        <select
                          value={adInputMode}
                          onChange={(e) => setAdInputMode(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 focus:border-orange-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                        >
                          <option value="cpa">{lang === 'fr' ? 'CPA par Lead' : 'تكلفة الطلب الواحد (CPA)'}</option>
                          <option value="total">{lang === 'fr' ? 'Budget Pub Total' : 'إجمالي مصروف الإعلانات'}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-300 mb-1 font-medium">
                          {adInputMode === 'cpa'
                            ? (lang === 'fr' ? `CPA par Lead (${adCurrency})` : `سعر الطلب CPA (${adCurrency})`)
                            : (lang === 'fr' ? `Budget Total (${adCurrency})` : `إجمالي الإعلان (${adCurrency})`)}
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={adValue}
                          onChange={(e) => setAdValue(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-orange-500/50 focus:border-orange-500 rounded-lg px-3 py-2 text-sm font-mono text-orange-400 font-bold outline-none"
                        />
                      </div>
                    </div>

                    {/* Exchange rates inputs if USD or EUR */}
                    {adCurrency !== 'DZD' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">
                            {lang === 'fr' ? 'Taux Dollar / USDT (Square DZD)' : 'سعر الدولار / USDT في السوق السوداء'}
                          </label>
                          <input
                            type="number"
                            value={usdRate}
                            onChange={(e) => setUsdRate(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white outline-none"
                          />
                        </div>

                        {adCurrency === 'EUR' && (
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">
                              {lang === 'fr' ? 'Taux Euro (Square DZD)' : 'سعر الأورو في السوق السوداء'}
                            </label>
                            <input
                              type="number"
                              value={eurRate}
                              onChange={(e) => setEurRate(Number(e.target.value))}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white outline-none"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Volume of leads */}
                    <div className="pt-2 border-t border-slate-800">
                      <label className="block text-xs text-slate-300 mb-1 font-medium">
                        {lang === 'fr' ? 'Nombre Total de Leads (Commandes initiales)' : 'عدد الطلبات الكلي (Leads)'}
                      </label>
                      <input
                        type="number"
                        value={totalLeads}
                        onChange={(e) => setTotalLeads(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 focus:border-orange-500 rounded-lg px-3 py-2 text-sm font-mono text-white outline-none"
                      />
                    </div>
                  </div>

                </div>
              </div>

              {/* Scenario Sensitivity Matrix (اختبار السناريوهات) */}
              <div className="bg-[#12151c] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-orange-400" />
                    <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">
                      {lang === 'fr' ? 'Simulateur de Scénarios CPA' : 'جدول تحليل السيناريوهات (Sensitivity Matrix)'}
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">
                    {lang === 'fr' ? 'Bénéfice Net Total selon CPA & Livraison' : 'صافي الربح حسب التوصيل والـ CPA'}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  {lang === 'fr'
                    ? 'Visualisez directement vos profits totaux selon l’évolution du CPA publicitaire et du taux de livraison effectif :'
                    : 'جدول يوضح أرباحك الصافية المتوقعة عند تغيّر سعر الإعلان ونسبة الشحن المسلمة:'}
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-center border-collapse">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-slate-300">
                        <th className="p-2 text-left font-mono">CPA / Delivery</th>
                        <th className="p-2">40% Livré</th>
                        <th className="p-2">50% Livré</th>
                        <th className="p-2">60% Livré</th>
                        <th className="p-2">70% Livré</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {[1.5, 2.0, 2.5, 3.0, 3.5, 4.0].map((testCpa) => {
                        const testCpaDZD = testCpa * (usdRate || 1);
                        return (
                          <tr key={testCpa} className={adValue === testCpa ? 'bg-orange-950/20' : 'hover:bg-slate-900/40'}>
                            <td className="p-2 font-bold text-slate-300 text-left">
                              {testCpa.toFixed(2)}$ <span className="text-[10px] text-slate-500">({Math.round(testCpaDZD)} DZD)</span>
                            </td>
                            {[40, 50, 60, 70].map((testDeliv) => {
                              // Quick calc for matrix
                              const leads = totalLeads;
                              const conf = confirmationRate / 100;
                              const deliv = testDeliv / 100;
                              const nDeliv = leads * conf * deliv;
                              const nRet = (leads * conf) - nDeliv;
                              const rev = nDeliv * sellingPrice;
                              const ops = (nDeliv * buyingCost) +
                                          (nDeliv * (shippingPayer === 'seller' ? totalShippingFee : shippingPayer === 'shared' ? Math.max(0, totalShippingFee - customerShippingContrib) : 0)) +
                                          (nRet * returnFee) +
                                          (leads * conf * callCenterFee) +
                                          (nDeliv * extraFee) +
                                          (rev * (codPercentage / 100));
                              const adSpend = leads * testCpaDZD;
                              const profit = rev - ops - adSpend;

                              return (
                                <td
                                  key={testDeliv}
                                  className={`p-2 font-bold ${
                                    profit > 0
                                      ? 'text-emerald-400 bg-emerald-950/10'
                                      : 'text-rose-400 bg-rose-950/10'
                                  }`}
                                >
                                  {Math.round(profit).toLocaleString()}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>
        )}

        {activeTab === 'kill-scale' && <KillScaleTab breakEvenCpa={calc.breakEvenCpaLeadUSD} lang={lang} />}
        {activeTab === 'marketing' && <MarketingTab lang={lang} />}

      </main>
    </div>
  );
}
