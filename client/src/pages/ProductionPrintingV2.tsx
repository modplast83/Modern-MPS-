import { useState, useEffect } from "react";
import type { RollWithDetails } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";

const ProductionPrintingV2: React.FC = () => {
  const [jobs, setJobs] = useState<RollWithDetails[]>([]);

  useEffect(() => {
    setJobs([
      {
        id: 2,
        roll_number: "R-002",
        weight: "30",
        status: "printing",
        current_stage: "printing",
        created_at: new Date().toISOString(),
      },
    ]);
  }, []);

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>🖨️ مرحلة الطباعة</CardTitle>
        </CardHeader>
        <CardContent>
          <ul>
            {jobs.map((job) => (
              <li key={job.id} className="border-b p-2">
                رول رقم {job.roll_number} – الحالة: {job.status}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductionPrintingV2;
