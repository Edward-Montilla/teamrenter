import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { properties, historicalData } from "../data/mock-data";

export function CategoryPerformance() {
  const [selectedProperty, setSelectedProperty] = useState("1");

  const categoryColors = {
    maintenance: "#0f1f3a",
    responsiveness: "#f59e0b",
    value: "#3b5580",
    safety: "#10b981",
    noise: "#8b5cf6",
    moveInOut: "#ec4899",
    cleanliness: "#06b6d4",
  };

  const categoryLabels = {
    maintenance: "Maintenance",
    responsiveness: "Management Responsiveness",
    value: "Value for Money",
    safety: "Building Safety",
    noise: "Noise & Neighbours",
    moveInOut: "Move-in/Move-out",
    cleanliness: "Overall Cleanliness",
  };

  const selectedPropertyData = properties.find((p) => p.id === selectedProperty);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
          Category Performance
        </h1>
        <p className="text-muted-foreground">
          TrustScore trends across all review categories
        </p>
      </div>

      <div className="mb-6">
        <label className="text-sm font-medium mb-2 block">Select Property</label>
        <Select value={selectedProperty} onValueChange={setSelectedProperty}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {properties.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>12-Month Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="month" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                domain={[0, 10]} 
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
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="maintenance"
                stroke={categoryColors.maintenance}
                strokeWidth={2}
                name={categoryLabels.maintenance}
                dot={{ fill: categoryColors.maintenance, r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="responsiveness"
                stroke={categoryColors.responsiveness}
                strokeWidth={2}
                name={categoryLabels.responsiveness}
                dot={{ fill: categoryColors.responsiveness, r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={categoryColors.value}
                strokeWidth={2}
                name={categoryLabels.value}
                dot={{ fill: categoryColors.value, r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="safety"
                stroke={categoryColors.safety}
                strokeWidth={2}
                name={categoryLabels.safety}
                dot={{ fill: categoryColors.safety, r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="noise"
                stroke={categoryColors.noise}
                strokeWidth={2}
                name={categoryLabels.noise}
                dot={{ fill: categoryColors.noise, r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="moveInOut"
                stroke={categoryColors.moveInOut}
                strokeWidth={2}
                name={categoryLabels.moveInOut}
                dot={{ fill: categoryColors.moveInOut, r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="cleanliness"
                stroke={categoryColors.cleanliness}
                strokeWidth={2}
                name={categoryLabels.cleanliness}
                dot={{ fill: categoryColors.cleanliness, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {selectedPropertyData && Object.entries(categoryLabels).map(([key, label]) => {
          const score = selectedPropertyData.categoryScores[key as keyof typeof selectedPropertyData.categoryScores];
          return (
            <Card key={key}>
              <CardContent className="p-6">
                <div className="text-sm text-muted-foreground mb-2">{label}</div>
                <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                  {score > 0 ? score.toFixed(1) : "—"}
                </div>
                <div 
                  className="h-2 bg-gray-200 rounded-full mt-3 overflow-hidden"
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${score * 10}%`,
                      backgroundColor: categoryColors[key as keyof typeof categoryColors],
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
