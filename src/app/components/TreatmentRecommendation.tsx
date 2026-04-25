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
    green: { bg: 'bg-green-50', text: 'text-green-900', border: 'border-green-200', icon: 'text-green-600' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-200', icon: 'text-blue-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-200', icon: 'text-amber-600' },
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
          <h3 className="font-semibold text-gray-900">Treatment Recommendations</h3>
          <p className="text-sm text-gray-500">ප්‍රතිකාර නිර්දේශ</p>
        </div>
        {diseaseName && (
          <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold uppercase max-w-[200px] truncate">
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
                <span className="text-xs text-gray-500 font-medium">({treatment.categorySi})</span>
              </div>

              <div className="space-y-2">
                {treatment.methods.map((method, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-3 shadow-sm border border-white">
                    <div className="flex items-start gap-2">
                      <CircleCheck className={`w-4 h-4 ${colors.icon} flex-shrink-0 mt-0.5`} />
                      <p className="text-sm font-medium text-gray-800 leading-snug">{method}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {recommendationData.guidelines && recommendationData.guidelines.length > 0 && (
        <div className="mt-4 p-4 bg-yellow-50/80 border border-yellow-200 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-yellow-600" />
            <p className="text-sm font-bold text-yellow-900 uppercase tracking-wider">Application Guidelines</p>
          </div>
          <ul className="text-sm text-yellow-800 space-y-2">
            {recommendationData.guidelines.map((guide, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-yellow-500 font-bold">•</span>
                <span className="font-medium">{guide}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}