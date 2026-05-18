import { Card } from './ui/card';
import { Leaf, Droplet, Shield, CircleCheck, Info } from 'lucide-react';

interface RecommendationData {
  organic?: string[];
  chemical?: string[];
  physical?: string[];
  guidelines?: string[];
}

interface TreatmentRecommendationProps {
  diseaseName?: string;
  recommendationData?: RecommendationData | null;
}

export function TreatmentRecommendation({ diseaseName, recommendationData }: TreatmentRecommendationProps) {
  if (!recommendationData) {
    return null;
  }

  const colorMap: Record<string, { bg: string; text: string; border: string; icon: string }> = {
    green: { bg: 'bg-green-50 dark:bg-green-900/10', text: 'text-green-900 dark:text-green-300', border: 'border-green-200 dark:border-green-800', icon: 'text-green-600' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/10', text: 'text-blue-900 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800', icon: 'text-blue-600' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-900/10', text: 'text-amber-900 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800', icon: 'text-amber-600' },
  };

  const sections = [];

  if (recommendationData.organic && recommendationData.organic.length > 0) {
    sections.push({
      category: 'Organic',
      categorySi: 'කාබනික',
      icon: Leaf,
      color: 'green',
      methods: recommendationData.organic
    });
  }

  if (recommendationData.chemical && recommendationData.chemical.length > 0) {
    sections.push({
      category: 'Chemical',
      categorySi: 'රසායනික',
      icon: Droplet,
      color: 'blue',
      methods: recommendationData.chemical
    });
  }

  if (recommendationData.physical && recommendationData.physical.length > 0) {
    sections.push({
      category: 'Physical',
      categorySi: 'භෞතික',
      icon: Shield,
      color: 'amber',
      methods: recommendationData.physical
    });
  }

  return (
    <Card className="p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Treatment Recommendations</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">ප්‍රතිකාර නිර්දේශ</p>
        </div>
        {diseaseName && (
          <div className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded-full text-xs font-semibold uppercase max-w-[200px] truncate border dark:border-red-800/50">
            {diseaseName}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sections.map((treatment) => {
          const Icon = treatment.icon;
          const colors = colorMap[treatment.color];

          return (
            <div key={treatment.category} className={`border rounded-xl p-4 ${colors.bg} ${colors.border}`}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-5 h-5 ${colors.icon}`} />
                <h4 className={`font-bold ${colors.text}`}>{treatment.category}</h4>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">({treatment.categorySi})</span>
              </div>

              <div className="space-y-2">
                {treatment.methods.map((method, idx) => (
                  <div key={idx} className="bg-card dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-start gap-2">
                      <CircleCheck className={`w-4 h-4 ${colors.icon} flex-shrink-0 mt-0.5`} />
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug">{method}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {recommendationData.guidelines && recommendationData.guidelines.length > 0 && (
        <div className="mt-4 p-4 bg-yellow-50/80 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
            <p className="text-sm font-bold text-yellow-900 dark:text-yellow-500 uppercase tracking-wider">Application Guidelines</p>
          </div>
          <ul className="text-sm text-yellow-800 dark:text-yellow-600 space-y-2">
            {recommendationData.guidelines.map((guide, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-yellow-500 font-bold">•</span>
                <span className="font-medium text-yellow-900 dark:text-yellow-500/80">{guide}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}