import { useState, useMemo, useEffect } from 'react';
import {
  DollarSign, Truck, Package, AlertTriangle, CheckCircle2, XCircle,
  Calculator, Share2, Check, Percent,
  BarChart3, Globe, Zap
} from 'lucide-react';
import { calculateProfit } from './lib/calculator';
import type { CalculatorInputs } from './lib/calculator';
import { initTelegram, setCloudStorageItem, shareToTopic, getCloudStorageItem } from './lib/telegram';

export default function App() {
  const [lang, setLang] = useState('fr');
  const [inputs, setInputs] = useState<CalculatorInputs>({
    sellingPrice: 6000,
    buyingCost: 2000,
    confirmationRate: 70,
    deliveryRate: 50,
    callCenterFee: 120,
    returnFee: 250,
    totalShippingFee: 700,
    shippingPayer: 'seller',
    customerShippingContrib: 300,
    codPercentage: 2,
    extraFee: 100,
    adCurrency: 'USD',
    adInputMode: 'cpa',
    adValue: 2.5,
    usdRate: 240,
    eurRate: 245,
    totalLeads: 100,
  });
  
  const [shared, setShared] = useState(false);
  
  // Setup Telegram & Load Data
  useEffect(() => {
    initTelegram();
    getCloudStorageItem('calculator_state').then((val) => {
      if (val) {
        try {
          const parsed = JSON.parse(val);
          setInputs(parsed.inputs);
          if (parsed.lang) setLang(parsed.lang);
        } catch(e) {}
      }
    });
  }, []);

  // Save state on change
  useEffect(() => {
    setCloudStorageItem('calculator_state', JSON.stringify({ inputs, lang }));
  }, [inputs, lang]);

  const updateInput = (key: keyof CalculatorInputs, value: any) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const applyPreset = (preset: string) => {
    if (preset === 'gadget') {
      setInputs({ ...inputs, sellingPrice: 3800, buyingCost: 1200, confirmationRate: 65, deliveryRate: 55, callCenterFee: 100, returnFee: 200, totalShippingFee: 700, shippingPayer: 'customer', customerShippingContrib: 600, adCurrency: 'USD', adInputMode: 'cpa', adValue: 1.8, totalLeads: 100 });
    } else if (preset === 'high_ticket') {
      setInputs({ ...inputs, sellingPrice: 12500, buyingCost: 4500, confirmationRate: 75, deliveryRate: 65, callCenterFee: 200, returnFee: 300, totalShippingFee: 800, shippingPayer: 'seller', customerShippingContrib: 0, adCurrency: 'USD', adInputMode: 'cpa', adValue: 4.5, totalLeads: 50 });
    } else if (preset === 'standard') {
      setInputs({ ...inputs, sellingPrice: 6000, buyingCost: 2000, confirmationRate: 70, deliveryRate: 50, callCenterFee: 120, returnFee: 250, totalShippingFee: 700, shippingPayer: 'seller', customerShippingContrib: 300, adCurrency: 'USD', adInputMode: 'cpa', adValue: 2.5, totalLeads: 100 });
    }
  };

  const calc = useMemo(() => calculateProfit(inputs), [inputs]);

  const getReportText = () => {
    return lang === 'fr' ? 
`📊 RAPPORT DE RENTABILITÉ ICOS:
• Prix de Vente: ${inputs.sellingPrice} DZD
• Coût Produit: ${inputs.buyingCost} DZD
• Taux Confirmation: ${inputs.confirmationRate}% | Livraison: ${inputs.deliveryRate}%
• CPA par Lead: ${calc.cpaPerLeadUSD.toFixed(2)}$ (${Math.round(calc.cpaPerLeadDZD)} DZD)
----------------------------------
🎯 CPA Break-Even Max: ${calc.breakEvenCpaLeadUSD.toFixed(2)}$ (${Math.round(calc.breakEvenCpaLeadDZD)} DZD)
💰 Prix d'Équilibre: ${Math.round(calc.breakEvenSellingPrice)} DZD
📈 Bénéfice Net Total: ${Math.round(calc.netProfitTotal)} DZD
💎 Bénéfice Net / Colis Livré: ${Math.round(calc.netProfitPerDelivered)} DZD
📊 Marge Nette: ${calc.profitMargin.toFixed(1)}%` 
: 
`📊 تقرير ربحية التجارة الإلكترونية COD:
• سعر البيع: ${inputs.sellingPrice} دج
• سعر الشراء: ${inputs.buyingCost} دج
• نسبة التأكيد: ${inputs.confirmationRate}% | التسليم: ${inputs.deliveryRate}%
• تكلفة الإعلان/طلب: ${calc.cpaPerLeadUSD.toFixed(2)}$ (${Math.round(calc.cpaPerLeadDZD)} دج)
----------------------------------
🎯 سعر التعادل CPA الأقصى: ${calc.breakEvenCpaLeadUSD.toFixed(2)}$ (${Math.round(calc.breakEvenCpaLeadDZD)} دج)
💰 سعر البيع للتعادل: ${Math.round(calc.breakEvenSellingPrice)} دج
📈 صافي الربح الإجمالي: ${Math.round(calc.netProfitTotal)} دج
💎 صافي الربح/قطعة مسلمة: ${Math.round(calc.netProfitPerDelivered)} دج
📊 هامش الربح الصافي: ${calc.profitMargin.toFixed(1)}%`;
  };

  const handleShare = async () => {
    const text = getReportText();
    const success = await shareToTopic(text);
    if(success) {
      setShared(true);
      setTimeout(() => setShared(false), 3000);
    } else {
      alert("Erreur de partage vers le topic Telegram. Assurez-vous d'avoir exécuté /bind_calcul.");
    }
  };

  const isRtl = lang === 'ar';
  const statusLabel = calc.status === 'good' ? (lang === 'fr' ? 'EXCELLENT' : 'ممتاز') :
                      calc.status === 'warning' ? (lang === 'fr' ? 'RISQUÉ' : 'مخاطرة') :
                      calc.status === 'bad' ? (lang === 'fr' ? 'PERTE' : 'خسارة') : (lang === 'fr' ? 'SAISISSEZ DONNÉES' : 'أدخل المعطيات');

  return (
    <div className={`min-h-screen bg-[var(--tg-theme-bg-color,#0a0c10)] text-[var(--tg-theme-text-color,#f1f5f9)] font-sans antialiased pb-12 selection:bg-orange-500 selection:text-white ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <header className="sticky top-0 z-40 bg-[var(--tg-theme-secondary-bg-color,#0d0f14)]/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white leading-tight flex items-center gap-2">
                ICOS <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full font-mono">PRO</span>
              </h1>
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
                onClick={handleShare}
                className="flex items-center gap-1.5 bg-[var(--tg-theme-button-color,#ea580c)] hover:bg-orange-500 text-[var(--tg-theme-button-text-color,#fff)] px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-md"
              >
                {shared ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{shared ? 'Partagé!' : 'Partager'}</span>
              </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Dashboard */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[var(--tg-theme-secondary-bg-color,#12151c)] border border-slate-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
              <h2 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-400" />
                {lang === 'fr' ? 'Décision Rapide' : 'القرار السريع'}
              </h2>
            </div>
            
            <div className={`rounded-xl p-4 mb-4 border transition-all ${
              calc.status === 'good' ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 
              calc.status === 'warning' ? 'bg-amber-950/40 border-amber-500/40 text-amber-300' : 
              calc.status === 'bad' ? 'bg-rose-950/40 border-rose-500/40 text-rose-300' : 
              'bg-slate-900/60 border-slate-800 text-slate-400'
            }`}>
              <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">
                {lang === 'fr' ? 'Verdict Produit' : 'قرار المنتج'}
              </div>
              <div className="text-xl sm:text-2xl font-extrabold flex items-center justify-between">
                <span>{statusLabel}</span>
                {calc.status === 'good' && <CheckCircle2 className="w-7 h-7" />}
                {calc.status === 'warning' && <AlertTriangle className="w-7 h-7" />}
                {calc.status === 'bad' && <XCircle className="w-7 h-7" />}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-[#181c26] border border-slate-800 rounded-xl p-3.5">
                <div className="text-xs text-slate-400 mb-1">{lang === 'fr' ? 'Bénéfice Net / Colis' : 'الربح الصافي للوحدة'}</div>
                <div className={`text-xl font-bold font-mono ${calc.netProfitPerDelivered >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {Math.round(calc.netProfitPerDelivered).toLocaleString()} <span className="text-xs font-normal">DZD</span>
                </div>
              </div>
              <div className="bg-[#181c26] border border-slate-800 rounded-xl p-3.5">
                <div className="text-xs text-slate-400 mb-1">{lang === 'fr' ? 'Marge Nette' : 'هامش الربح'}</div>
                <div className={`text-xl font-bold font-mono ${calc.profitMargin >= 20 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {calc.profitMargin.toFixed(1)} %
                </div>
              </div>
            </div>
          </div>
          
           <div className="bg-[var(--tg-theme-secondary-bg-color,#12151c)] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
            <h2 className="font-bold text-sm text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-orange-400" />
              {lang === 'fr' ? 'Métriques' : 'عرض التفاصيل'}
            </h2>
            <div className="bg-gradient-to-r from-orange-950/40 via-amber-950/20 to-slate-900 border border-orange-500/30 rounded-xl p-4 mb-4">
              <div className="text-xs text-orange-300 font-semibold uppercase tracking-wider mb-1">
                 🎯 {lang === 'fr' ? 'CPA Break-Even Max' : 'أقصى تكلفة إعلان للطلب'}
              </div>
              <div className="text-2xl font-extrabold font-mono text-white">
                {calc.breakEvenCpaLeadUSD.toFixed(2)} $ <span className="text-sm text-slate-400 font-normal">({Math.round(calc.breakEvenCpaLeadDZD)} DZD)</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2.5 text-xs">
               <div className="bg-[#171b24] p-3 rounded-lg border border-slate-800">
                <div className="text-slate-400">{lang === 'fr' ? 'Commandes Livrées' : 'عدد الطلبات المسلمة'}</div>
                <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">{calc.deliveredOrders.toFixed(1)}</div>
              </div>
              <div className="bg-[#171b24] p-3 rounded-lg border border-slate-800">
                <div className="text-slate-400">{lang === 'fr' ? 'CPA / Livré' : 'تكلفة / طلبية مسلمة'}</div>
                <div className="text-base font-bold font-mono text-slate-100 mt-0.5">{Math.round(calc.cpaPerDeliveredDZD)} DZD</div>
              </div>
              <div className="col-span-2 bg-[#171b24] p-3.5 rounded-lg border border-slate-800 flex items-center justify-between">
                <div className="text-slate-400">{lang === 'fr' ? 'Bénéfice Net Total' : 'إجمالي الربح الصافي'}</div>
                <div className={`text-xl font-black font-mono ${calc.netProfitTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {Math.round(calc.netProfitTotal).toLocaleString()} DZD
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Inputs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[var(--tg-theme-secondary-bg-color,#12151c)] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
             <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs mb-5 w-fit">
              <button onClick={() => applyPreset('standard')} className="px-3 py-1 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-all">Standard</button>
              <button onClick={() => applyPreset('gadget')} className="px-3 py-1 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-all">Gadget</button>
              <button onClick={() => applyPreset('high_ticket')} className="px-3 py-1 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-all">High Ticket</button>
            </div>
            
            <div className="space-y-4">
               {/* Prix */}
              <div className="bg-[#161a24] p-4 rounded-xl border border-slate-800">
                <div className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <Package className="w-4 h-4" /> {lang === 'fr' ? 'Prix & Coût' : 'السعر والتكلفة'}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">{lang === 'fr' ? 'Prix Vente' : 'سعر البيع'}</label>
                    <input type="number" value={inputs.sellingPrice} onChange={e => updateInput('sellingPrice', Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 focus:border-orange-500 rounded-lg px-3 py-2 text-sm font-mono outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">{lang === 'fr' ? 'Coût Achat' : 'سعر الشراء'}</label>
                    <input type="number" value={inputs.buyingCost} onChange={e => updateInput('buyingCost', Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 focus:border-orange-500 rounded-lg px-3 py-2 text-sm font-mono outline-none" />
                  </div>
                </div>
              </div>

               {/* Taux */}
               <div className="bg-[#161a24] p-4 rounded-xl border border-slate-800">
                <div className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <Percent className="w-4 h-4" /> {lang === 'fr' ? 'Taux %' : 'نسب'}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-300 flex justify-between mb-1">
                      <span>{lang === 'fr' ? 'Confirmation' : 'التأكيد'}</span> <span className="text-orange-400">{inputs.confirmationRate}%</span>
                    </label>
                    <input type="range" min="10" max="100" value={inputs.confirmationRate} onChange={e => updateInput('confirmationRate', Number(e.target.value))} className="w-full accent-orange-500" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 flex justify-between mb-1">
                      <span>{lang === 'fr' ? 'Livraison' : 'التسليم'}</span> <span className="text-emerald-400">{inputs.deliveryRate}%</span>
                    </label>
                    <input type="range" min="10" max="100" value={inputs.deliveryRate} onChange={e => updateInput('deliveryRate', Number(e.target.value))} className="w-full accent-emerald-500" />
                  </div>
                </div>
              </div>
              
              {/* Logistique */}
              <div className="bg-[#161a24] p-4 rounded-xl border border-slate-800">
                <div className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <Truck className="w-4 h-4" /> {lang === 'fr' ? 'Logistique' : 'الشحن'}
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">{lang === 'fr' ? 'Frais Livraison' : 'تكلفة التوصيل'}</label>
                    <input type="number" value={inputs.totalShippingFee} onChange={e => updateInput('totalShippingFee', Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 focus:border-orange-500 rounded-lg px-3 py-2 text-sm font-mono outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">{lang === 'fr' ? 'Frais Retour' : 'تكلفة الروتور'}</label>
                    <input type="number" value={inputs.returnFee} onChange={e => updateInput('returnFee', Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 focus:border-orange-500 rounded-lg px-3 py-2 text-sm font-mono outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                   <div>
                    <label className="block text-xs text-slate-300 mb-1">{lang === 'fr' ? 'Call Center' : 'تكلفة التأكيد'}</label>
                    <input type="number" value={inputs.callCenterFee} onChange={e => updateInput('callCenterFee', Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 focus:border-orange-500 rounded-lg px-3 py-2 text-sm font-mono outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">{lang === 'fr' ? 'COD (%)' : 'نسبة COD'}</label>
                    <input type="number" step="0.5" value={inputs.codPercentage} onChange={e => updateInput('codPercentage', Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 focus:border-orange-500 rounded-lg px-3 py-2 text-sm font-mono outline-none" />
                  </div>
                </div>
              </div>

               {/* Pub */}
               <div className="bg-[#161a24] p-4 rounded-xl border border-slate-800">
                <div className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <DollarSign className="w-4 h-4" /> {lang === 'fr' ? 'Publicité' : 'الإعلانات'}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">{lang === 'fr' ? 'CPA par Lead ($)' : 'CPA ($)'}</label>
                    <input type="number" step="0.1" value={inputs.adValue} onChange={e => updateInput('adValue', Number(e.target.value))} className="w-full bg-slate-900 border border-orange-500/50 focus:border-orange-500 rounded-lg px-3 py-2 text-sm font-mono text-orange-400 font-bold outline-none" />
                  </div>
                  <div>
                     <label className="block text-xs text-slate-300 mb-1">{lang === 'fr' ? 'Nombre Leads' : 'عدد الطلبات الكلي'}</label>
                    <input type="number" value={inputs.totalLeads} onChange={e => updateInput('totalLeads', Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 focus:border-orange-500 rounded-lg px-3 py-2 text-sm font-mono outline-none" />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
