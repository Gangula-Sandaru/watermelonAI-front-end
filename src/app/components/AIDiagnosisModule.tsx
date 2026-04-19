import { Card } from './ui/card';
import { Upload, CircleCheck, CircleAlert, Leaf } from 'lucide-react';
import { Button } from './ui/button';

export function AIDiagnosisModule() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">AI Disease Diagnosis</h3>
          <p className="text-sm text-gray-500">AI රෝග විනිශ්චය පද්ධතිය</p>
        </div>
        <Leaf className="w-8 h-8 text-[#2E7D32]" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Upload Area */}
        <div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="font-medium text-gray-700 mb-1">Upload Leaf Image</p>
            <p className="text-sm text-gray-500 mb-1">ලීෆ් රූපයක් උඩුගත කරන්න</p>
            <p className="text-xs text-gray-400 mt-3">
              Drag & drop or click to browse<br />
              Supported: JPG, PNG (Max 10MB)
            </p>
          </div>

          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Sample Image Analysis</p>
            <img
              src="https://images.unsplash.com/photo-1685400688824-7b62c6999fc9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXRlcm1lbG9uJTIwbGVhZiUyMGRpc2Vhc2V8ZW58MXx8fHwxNzY3NDMzNzQ2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Watermelon leaf with disease spots"
              className="w-full h-40 object-cover rounded-lg border border-gray-200"
            />
            <p className="text-xs text-gray-500 mt-2">Analyzing: watermelon_leaf_sample_001.jpg</p>
          </div>
        </div>

        {/* Analysis Results */}
        <div>
          <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <CircleCheck className="w-8 h-8 text-green-600" />
                <div>
                  <h4 className="font-bold text-green-900">Analysis Complete</h4>
                  <p className="text-sm text-green-700">විශ්ලේෂණය සම්පූර්ණයි</p>
                </div>
              </div>
            </div>

            {/* Disease Detection */}
            <div className="bg-white rounded-lg p-4 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Detected Disease</span>
                <span className="text-sm font-bold text-red-600">ANTHRACNOSE</span>
              </div>
              <p className="text-xs text-gray-600 mb-3">ඇන්ත්‍රක්නෝස් (කොලෙටොට්‍රයිචම් ලේජනේරියම්)</p>
              
              {/* Confidence Score */}
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Confidence Score</span>
                  <span className="font-bold text-green-600">95.3%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-green-600 h-3 rounded-full" style={{ width: '95.3%' }}></div>
                </div>
              </div>
            </div>

            {/* Disease Characteristics */}
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-900 mb-2">Identified Symptoms:</p>
              <ul className="text-xs text-gray-700 space-y-1">
                <li className="flex items-start gap-2">
                  <CircleAlert className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                  <span>Dark, sunken lesions on leaves</span>
                </li>
                <li className="flex items-start gap-2">
                  <CircleAlert className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                  <span>Circular spots with pink spore masses</span>
                </li>
                <li className="flex items-start gap-2">
                  <CircleAlert className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                  <span>Yellow halo around infected areas</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1 bg-[#2E7D32] hover:bg-[#1B5E20]">
              View Treatment Plan
            </Button>
            <Button variant="outline" className="flex-1">
              Save Report
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm font-medium text-blue-900 mb-1">
          <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
          Model Information
        </p>
        <p className="text-xs text-blue-700">
          CNN Architecture: ResNet-50 • Training Accuracy: 97.8% • Dataset: 15,000+ labeled images
        </p>
      </div>
    </Card>
  );
}