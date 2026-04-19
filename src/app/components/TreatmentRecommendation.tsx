import { Card } from './ui/card';
import { Leaf, Droplet, Shield, CircleCheck } from 'lucide-react';

export function TreatmentRecommendation() {
  const treatments = [
    {
      category: 'Organic',
      categorySi: 'කාබනික',
      icon: Leaf,
      color: 'green',
      methods: [
        { name: 'Neem oil spray', nameSi: 'කොහොඹ තෙල් ඉසීම', effectiveness: '70%' },
        { name: 'Copper-based fungicide', nameSi: 'තඹ පදනම් පිළිකා නාශක', effectiveness: '75%' },
        { name: 'Biological control agents', nameSi: 'ජීව විද්‍යාත්මක පාලන කාරක', effectiveness: '65%' },
      ],
    },
    {
      category: 'Chemical',
      categorySi: 'රසායනික',
      icon: Droplet,
      color: 'blue',
      methods: [
        { name: 'Mancozeb 75% WP', nameSi: 'මැන්කොසෙබ් 75%', effectiveness: '90%' },
        { name: 'Chlorothalonil', nameSi: 'ක්ලෝරොතලෝනිල්', effectiveness: '85%' },
        { name: 'Azoxystrobin', nameSi: 'ඇසොක්සිස්ට්‍රොබින්', effectiveness: '88%' },
      ],
    },
    {
      category: 'Physical',
      categorySi: 'භෞතික',
      icon: Shield,
      color: 'amber',
      methods: [
        { name: 'Remove infected leaves', nameSi: 'ආසාදිත කොළ ඉවත් කරන්න', effectiveness: '60%' },
        { name: 'Improve air circulation', nameSi: 'වාතාශ්‍රය වැඩිදියුණු කරන්න', effectiveness: '55%' },
        { name: 'Reduce leaf wetness', nameSi: 'කොළ තෙතමනය අඩු කරන්න', effectiveness: '50%' },
      ],
    },
  ];

  const colorMap: Record<string, { bg: string; text: string; border: string; icon: string }> = {
    green: { bg: 'bg-green-50', text: 'text-green-900', border: 'border-green-200', icon: 'text-green-600' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-200', icon: 'text-blue-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-200', icon: 'text-amber-600' },
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Treatment Recommendations</h3>
          <p className="text-sm text-gray-500">ප්‍රතිකාර නිර්දේශ</p>
        </div>
        <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
          ANTHRACNOSE
        </div>
      </div>

      <div className="space-y-4">
        {treatments.map((treatment) => {
          const Icon = treatment.icon;
          const colors = colorMap[treatment.color];

          return (
            <div key={treatment.category} className={`border rounded-lg p-4 ${colors.bg} ${colors.border}`}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-5 h-5 ${colors.icon}`} />
                <h4 className={`font-semibold ${colors.text}`}>{treatment.category}</h4>
                <span className="text-xs text-gray-500">({treatment.categorySi})</span>
              </div>

              <div className="space-y-2">
                {treatment.methods.map((method, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CircleCheck className="w-4 h-4 text-[#2E7D32] flex-shrink-0" />
                          <p className="text-sm font-medium text-gray-900">{method.name}</p>
                        </div>
                        <p className="text-xs text-gray-600 ml-6">{method.nameSi}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-semibold text-[#2E7D32]">{method.effectiveness}</span>
                        <span className="text-xs text-gray-500">effective</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm font-semibold text-yellow-900 mb-1">⚠️ Application Guidelines</p>
        <ul className="text-xs text-yellow-800 space-y-1">
          <li>• Apply treatments during early morning or late evening</li>
          <li>• Rotate chemical fungicides to prevent resistance</li>
          <li>• Follow recommended dosage and safety precautions</li>
          <li>• Monitor crop response after 7-10 days</li>
        </ul>
      </div>
    </Card>
  );
}