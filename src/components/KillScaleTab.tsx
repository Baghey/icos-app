import { useState } from 'react';
import { Target, Activity, TrendingUp, TrendingDown, AlertOctagon } from 'lucide-react';

export default function KillScaleTab({ breakEvenCpa, lang }: { breakEvenCpa: number, lang: string }) {
  const [spend, setSpend] = useState<number>(0);
  const [leads, setLeads] = useState<number>(0);

  const currentCpa = leads > 0 ? spend / leads : 0;
  
  let verdict = 'WAIT';
  let color = 'text-slate-400';
  let bgColor = 'bg-slate-900/50';
  let borderColor = 'border-slate-800';

  if (spend > 0 && leads > 0) {
    if (currentCpa > breakEvenCpa * 1.15) {
      verdict = 'KILL';
      color = 'text-rose-400';
      bgColor = 'bg-rose-950/30';
      borderColor = 'border-rose-500/50';
    } else if (currentCpa < breakEvenCpa * 0.85) {
      verdict = 'SCALE';
      color = 'text-emerald-400';
      bgColor = 'bg-emerald-950/30';
      borderColor = 'border-emerald-500/50';
    } else {
      verdict = 'WATCH';
      color = 'text-amber-400';
      bgColor = 'bg-amber-950/30';
      borderColor = 'border-amber-500/50';
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[var(--tg-theme-secondary-bg-color,#12151c)] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <h2 className="font-bold text-lg text-white flex items-center gap-2 mb-6">
          <Activity className="text-orange-500" />
          {lang === 'fr' ? 'Simulateur : Kill or Scale' : 'محاكي الإعلانات'}
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <label className="block text-xs text-slate-400 mb-2">{lang === 'fr' ? 'Dépense Ad ($)' : 'المبلغ المصروف'}</label>
            <input 
              type="number" 
              value={spend || ''} 
              onChange={e => setSpend(Number(e.target.value))}
              placeholder="Ex: 50"
              className="w-full bg-slate-800 border border-slate-700 focus:border-orange-500 rounded-lg px-3 py-2 text-white font-mono outline-none" 
            />
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <label className="block text-xs text-slate-400 mb-2">{lang === 'fr' ? 'Leads obtenus' : 'الطلبات المحصلة'}</label>
            <input 
              type="number" 
              value={leads || ''} 
              onChange={e => setLeads(Number(e.target.value))}
              placeholder="Ex: 15"
              className="w-full bg-slate-800 border border-slate-700 focus:border-orange-500 rounded-lg px-3 py-2 text-white font-mono outline-none" 
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl mb-6">
          <div>
            <div className="text-xs text-slate-400 mb-1">{lang === 'fr' ? 'CPA Actuel' : 'CPA الحالي'}</div>
            <div className="text-2xl font-bold font-mono text-white">{currentCpa.toFixed(2)}$</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1 justify-end">
              <Target className="w-3 h-3 text-orange-400" />
              {lang === 'fr' ? 'CPA Break-Even (Marge 0)' : 'CPA التعادل'}
            </div>
            <div className="text-xl font-bold font-mono text-orange-400">{breakEvenCpa.toFixed(2)}$</div>
          </div>
        </div>

        <div className={`p-6 rounded-xl border-2 text-center transition-all ${bgColor} ${borderColor}`}>
          <div className="text-sm font-bold text-slate-300 mb-2 uppercase tracking-widest">{lang === 'fr' ? 'Verdict Recommandé' : 'القرار المنصوح به'}</div>
          <div className={`text-4xl font-black tracking-tight flex items-center justify-center gap-3 ${color}`}>
            {verdict === 'KILL' && <AlertOctagon className="w-8 h-8" />}
            {verdict === 'SCALE' && <TrendingUp className="w-8 h-8" />}
            {verdict === 'WATCH' && <TrendingDown className="w-8 h-8" />}
            {verdict === 'WAIT' && '---'}
            {verdict}
          </div>
          <p className="mt-3 text-sm text-slate-400">
            {verdict === 'KILL' && (lang === 'fr' ? "Coupez cette campagne, elle vous fait perdre de l'argent." : "أوقف هذه الحملة، إنها تخسرك المال.")}
            {verdict === 'SCALE' && (lang === 'fr' ? "Excellente rentabilité ! Vous pouvez augmenter le budget." : "ربحية ممتازة! يمكنك زيادة الميزانية.")}
            {verdict === 'WATCH' && (lang === 'fr' ? "Campagne moyenne. Laissez tourner et observez." : "حملة متوسطة. اتركها تعمل ولاحظ.")}
            {verdict === 'WAIT' && (lang === 'fr' ? "Entrez vos dépenses du jour pour voir le verdict." : "أدخل مصروفك اليومي لرؤية القرار.")}
          </p>
        </div>
      </div>
    </div>
  );
}
