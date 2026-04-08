import { LineChart, Line, ResponsiveContainer } from "recharts";
import { Eye, MousePointer, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { properties } from "../data/mock-data";

export function RenterSignals() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
          Renter Interest Signals
        </h1>
        <p className="text-muted-foreground">
          Track engagement metrics and conversion rates
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Eye className="w-5 h-5 text-[#0f1f3a]" />
              <span className="text-sm text-muted-foreground">Total Page Views</span>
            </div>
            <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              6,452
            </div>
            <p className="text-sm text-green-600 mt-1">+12.3% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <MousePointer className="w-5 h-5 text-[#0f1f3a]" />
              <span className="text-sm text-muted-foreground">Profile Visits</span>
            </div>
            <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              1,575
            </div>
            <p className="text-sm text-green-600 mt-1">+8.7% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-[#0f1f3a]" />
              <span className="text-sm text-muted-foreground">Avg. Conversion</span>
            </div>
            <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              10.2%
            </div>
            <p className="text-sm text-green-600 mt-1">+2.1% from last month</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Property Performance (30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead className="text-right">Page Views</TableHead>
                <TableHead className="text-right">Profile Visits</TableHead>
                <TableHead className="text-right">Conversion Rate</TableHead>
                <TableHead>Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((property) => {
                const trendColor = 
                  property.conversionRate >= 15 ? "#10b981" :
                  property.conversionRate >= 10 ? "#f59e0b" :
                  "#ef4444";
                
                return (
                  <TableRow key={property.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{property.name}</div>
                        <div className="text-sm text-muted-foreground">{property.address}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {property.pageViews30d.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {property.profileVisits30d.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge 
                        variant="outline"
                        style={{ 
                          backgroundColor: `${trendColor}20`,
                          borderColor: trendColor,
                          color: trendColor
                        }}
                      >
                        {property.conversionRate.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="w-24 h-8">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={property.sparklineData.map(v => ({ value: v }))}>
                            <Line 
                              type="monotone" 
                              dataKey="value" 
                              stroke={trendColor}
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
