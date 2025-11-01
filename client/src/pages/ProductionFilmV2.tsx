import { useState, useEffect } from "react";
import type { RollWithDetails } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";

const ProductionFilmV2: React.FC = () => {
  const [rolls, setRolls] = useState<RollWithDetails[]>([]);

  useEffect(() => {
    setRolls([
      {
        id: 1,
        roll_number: "R-001",
        weight: "25",
        status: "active",
        current_stage: "film",
        created_at: new Date().toISOString(),
      },
    ]);
  }, []);

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>🎞️ إنتاج الفيلم</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100 text-right">
                <th className="p-2">رقم الرول</th>
                <th className="p-2">الوزن (كجم)</th>
                <th className="p-2">المرحلة الحالية</th>
                <th className="p-2">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {rolls.map((roll) => (
                <tr key={roll.id} className="border-t">
                  <td className="p-2">{roll.roll_number}</td>
                  <td className="p-2">{roll.weight}</td>
                  <td className="p-2">{roll.current_stage}</td>
                  <td className="p-2">{roll.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductionFilmV2;
