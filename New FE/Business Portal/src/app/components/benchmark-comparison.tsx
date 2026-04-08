import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { properties, calgaryAverages } from "../data/mock-data";

export function BenchmarkComparison() {
  const [selectedProperty, setSelectedProperty] = useState("1");

  const selectedPropertyData = properties.find((p) => p.id === selectedProperty);

  const comparisonData = selectedPropertyData
    ? [
        {
          category: "Maintenance",
          property: selectedPropertyData.categoryScores.maintenance,
          average: calgaryAverages.maintenance,
        },
        {
          category: "Responsiveness",
          property: selectedPropertyData.categoryScores.responsiveness,
          average: calgaryAverages.responsiveness,
        },
        {
          category: "Value",
          property: selectedPropertyData.categoryScores.value,
          average: calgaryAverages.value,
        },
        {
          category: "Safety",
          property: selectedPropertyData.categoryScores.safety,
          average: calgaryAverages.safety,
        },
        {
          category: "Noise",
          property: selectedPropertyData.categoryScores.noise,
          average: calgaryAverages.noise,
        },
        {
          category: "Move In/Out",
          property: selectedPropertyData.categoryScores.moveInOut,
          average: calgaryAverages.moveInOut,
        },
        {
          category: "Cleanliness",
          property: selectedPropertyData.categoryScores.cleanliness,
          average: calgaryAverages.cleanliness,
        },
      ]
    : [];

  // Find biggest gap
  const gaps = comparisonData.map((d) => ({
    category: d.category,
    gap: d.property - d.average,
  }));
  const biggestGap = gaps.reduce((prev, current) =>
    Math.abs(current.gap) > Math.abs(prev.gap) ? current : prev
  , gaps[0]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
          Benchmark Comparison
        </h1>
        <p className="text-muted-foreground">
          Compare your property scores against Calgary city averages
        </p>
      </div>

      <div className="mb-6">
        <label className="text-sm font-medium mb-2 block">Select Property</label>
        <Select value={selectedProperty} onValueChange={setSelectedProperty}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {properties.filter(p => p.trustScore > 0).map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {biggestGap && biggestGap.gap < -0.5 && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Performance Gap Detected</h3>
                <p className="text-red-800">
                  You're <span className="font-bold">{Math.abs(biggestGap.gap).toFixed(1)}</span> points 
                  below the Calgary average in <span className="font-bold">{biggestGap.category}</span>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Category Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={500}>
            <BarChart 
              data={comparisonData} 
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                type="number" 
                domain={[0, 10]}
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                type="category" 
                dataKey="category"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '12px'
                }}
              />
              <ReferenceLine x={7.5} stroke="#6b7280" strokeDasharray="3 3" />
              <Bar dataKey="average" fill="#9ca3af" name="Calgary Average" radius={[0, 4, 4, 0]} />
              <Bar dataKey="property" name="Your Property" radius={[0, 4, 4, 0]}>
                {comparisonData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.property >= entry.average ? "#10b981" : "#ef4444"} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#10b981] rounded"></div>
              <span className="text-sm text-muted-foreground">Above average</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#ef4444] rounded"></div>
              <span className="text-sm text-muted-foreground">Below average</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
