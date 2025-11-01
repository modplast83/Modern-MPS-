import { useState, useEffect } from "react";
import type { RollWithDetails } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";

const ProductionCuttingV2: React.FC = () => {
  const [cutJobs, setCutJobs] = useState<RollWithDetails[]>([]);

  useEffect(() => {
    setCutJobs([
      {
        id: 3,
        roll_number: "R-003",
        weight: "20",
        status: "cutting",
        current_stage: "cutting",
        created_at: new Date().toISOString(),
      },
    ]);
  }, []);

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>✂️ مرحلة التقطيع</CardTitle>
        </CardHeader>
        <CardContent>
          <ul>
            {cutJobs.map((job) => (
              <li key={job.id} className="border-b p-2">
                رول رقم {job.roll_number} – الوزن: {job.weight} كجم – الحالة: {job.status}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductionCuttingV2;
