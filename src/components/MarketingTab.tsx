import { useState } from 'react';
import { Lightbulb, Sparkles, Copy, Check } from 'lucide-react';

export default function MarketingTab({ lang }: { lang: string }) {
  const [productName, setProductName] = useState('');
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  const generateIdeas = () => {
    if (!productName.trim()) return;
    setGenerated(true);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[var(--tg-theme-secondary-bg-color,#12151c)] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <h2 className="font-bold text-lg text-white flex items-center gap-2 mb-2">
          <Lightbulb className="text-orange-500" />
          {lang === 'fr' ? 'Générateur Marketing (IA)' : 'المولد التسويقي الذكي'}
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          {lang === 'fr' 
            ? 'Entrez le nom de votre produit pour générer des angles de vente et textes publicitaires optimisés pour le marché local.'
            : 'أدخل اسم منتجك لتوليد أفكار تسويقية ونصوص إعلانية مخصصة للسوق المحلي.'}
        </p>

        <div className="flex gap-3 mb-8">
          <input 
            type="text" 
            value={productName} 
            onChange={e => setProductName(e.target.value)}
            placeholder={lang === 'fr' ? 'Ex: Brosse lissante, Ceinture dos...' : 'مثال: فرشاة الشعر...'}
            className="flex-1 bg-slate-900 border border-slate-700 focus:border-orange-500 rounded-xl px-4 py-3 text-white outline-none" 
          />
          <button 
            onClick={generateIdeas}
            className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">{lang === 'fr' ? 'Générer' : 'توليد'}</span>
          </button>
        </div>

        {generated && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            {/* Angle 1 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative group">
              <button onClick={() => copyToClipboard(`Angle Santé/Pratique: ${productName}`, 1)} className="absolute top-4 right-4 text-slate-500 hover:text-orange-400 transition-colors">
                {copied === 1 ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <div className="text-xs text-orange-400 font-bold mb-2 uppercase tracking-wider">{lang === 'fr' ? 'Angle 1 : Résolution de problème (Douleur)' : 'الزاوية 1: حل مشكلة'}</div>
              <p className="text-sm text-slate-300 italic mb-3">"{lang === 'fr' ? 'Focus sur la douleur ou la frustration que ressent le client sans ce produit.' : 'التركيز على المعاناة بدون هذا المنتج.'}"</p>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-sm text-slate-200">
                <span className="font-bold text-white">Hook TikTok :</span> 🛑 {lang === 'fr' ? `Fatigué des problèmes avec votre ancien matériel ? Découvrez le nouveau ${productName} !` : `علاج نهائي لمشاكلك مع ${productName}!`}
                <br/><br/>
                <span className="font-bold text-white">Texte FB :</span> {lang === 'fr' ? `Ne laissez plus la douleur gâcher votre journée. Notre ${productName} est conçu spécialement pour soulager et améliorer votre quotidien en 5 minutes. ✅ Paiement à la livraison.` : `لا تدع المعاناة تفسد يومك. ${productName} مصمم خصيصا لك.`}
              </div>
            </div>

            {/* Angle 2 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative group">
              <button onClick={() => copyToClipboard(`Angle Gain de Temps: ${productName}`, 2)} className="absolute top-4 right-4 text-slate-500 hover:text-orange-400 transition-colors">
                {copied === 2 ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <div className="text-xs text-orange-400 font-bold mb-2 uppercase tracking-wider">{lang === 'fr' ? 'Angle 2 : Gain de temps / Facilité' : 'الزاوية 2: توفير الوقت'}</div>
              <p className="text-sm text-slate-300 italic mb-3">"{lang === 'fr' ? 'Focus sur la rapidité et la paresse. Les gens veulent des résultats rapides.' : 'التركيز على السرعة وسهولة الاستخدام.'}"</p>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-sm text-slate-200">
                <span className="font-bold text-white">Hook TikTok :</span> ⏱️ {lang === 'fr' ? `Le secret pour gagner 2 heures par jour ! Regardez comment marche le ${productName}.` : `السر لتوفير وقتك! شاهد كيف يعمل ${productName}.`}
                <br/><br/>
                <span className="font-bold text-white">Texte FB :</span> {lang === 'fr' ? `Marre de perdre du temps ? Avec le ${productName}, obtenez des résultats professionnels depuis la maison, sans effort. 🚚 Livraison 58 wilayas.` : `هل مللت من تضييع الوقت؟ احصل على نتائج احترافية مع ${productName}.`}
              </div>
            </div>
            
            <div className="text-center mt-4">
              <p className="text-xs text-slate-500">
                {lang === 'fr' ? 'Astuce : Testez les deux textes avec 5$ chacun pour voir lequel apporte le moins cher CPA !' : 'نصيحة: جرب النصين بميزانية 5$ لترى أيهما الأفضل!'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
