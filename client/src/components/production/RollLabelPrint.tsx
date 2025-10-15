import { format } from "date-fns";

interface RollLabelPrintProps {
  roll: {
    id: number;
    roll_number: string;
    roll_seq: number;
    weight_kg: number;
    machine_id?: string;
    qr_code_text?: string;
    created_at?: string;
    created_by_name?: string;
    printed_by_name?: string;
    printed_at?: string;
    cut_by_name?: string;
    cut_at?: string;
    cut_weight_total_kg?: number;
    status?: string;
  };
  productionOrder?: {
    production_order_number: string;
    item_name?: string;
    item_name_ar?: string;
    size_caption?: string;
  };
  order?: {
    order_number: string;
    customer_name?: string;
    customer_name_ar?: string;
  };
}

export function printRollLabel({ roll, productionOrder, order }: RollLabelPrintProps) {
  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "created":
        return "تم الإنشاء";
      case "printed":
        return "تم الطباعة";
      case "cut":
        return "تم التقطيع";
      default:
        return status || "غير محدد";
    }
  };

  const printContent = `
    <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>ليبل رول - ${roll.roll_number}</title>
        <style>
          @page {
            size: 10cm 7cm;
            margin: 0;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            direction: rtl;
            margin: 0;
            padding: 10mm;
            font-size: 10pt;
            line-height: 1.3;
            color: #000;
          }
          
          .label-container {
            border: 2px solid #000;
            padding: 5mm;
            height: 100%;
            box-sizing: border-box;
          }
          
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 3mm;
            margin-bottom: 3mm;
          }
          
          .header h1 {
            font-size: 16pt;
            font-weight: bold;
            margin: 0 0 2mm 0;
          }
          
          .qr-code {
            text-align: center;
            margin: 3mm 0;
          }
          
          .qr-code-text {
            font-family: monospace;
            font-size: 9pt;
            font-weight: bold;
            letter-spacing: 1px;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2mm;
            margin: 3mm 0;
          }
          
          .info-item {
            border: 1px solid #333;
            padding: 2mm;
            background: #f9f9f9;
          }
          
          .info-label {
            font-weight: bold;
            font-size: 8pt;
            color: #555;
            margin-bottom: 1mm;
          }
          
          .info-value {
            font-size: 11pt;
            font-weight: bold;
            color: #000;
          }
          
          .full-width {
            grid-column: 1 / -1;
          }
          
          .status-box {
            text-align: center;
            padding: 2mm;
            margin-top: 2mm;
            border: 2px solid #000;
            background: #f0f0f0;
            font-weight: bold;
            font-size: 12pt;
          }
          
          .footer {
            margin-top: 3mm;
            text-align: center;
            font-size: 7pt;
            color: #666;
          }
          
          @media print {
            body { margin: 0; padding: 10mm; }
            .label-container { page-break-after: always; }
          }
        </style>
      </head>
      <body>
        <div class="label-container">
          <div class="header">
            <h1>ليبل رول</h1>
            <div style="font-size: 12pt; font-weight: bold;">${roll.roll_number}</div>
          </div>
          
          ${roll.qr_code_text ? `
            <div class="qr-code">
              <div class="qr-code-text">${roll.qr_code_text}</div>
            </div>
          ` : ''}
          
          <div class="info-grid">
            ${order ? `
              <div class="info-item full-width">
                <div class="info-label">العميل</div>
                <div class="info-value">${order.customer_name_ar || order.customer_name || 'غير محدد'}</div>
              </div>
              
              <div class="info-item">
                <div class="info-label">رقم الطلب</div>
                <div class="info-value">${order.order_number}</div>
              </div>
            ` : ''}
            
            ${productionOrder ? `
              <div class="info-item">
                <div class="info-label">رقم أمر الإنتاج</div>
                <div class="info-value">${productionOrder.production_order_number}</div>
              </div>
              
              ${productionOrder.item_name_ar || productionOrder.item_name ? `
                <div class="info-item full-width">
                  <div class="info-label">المنتج</div>
                  <div class="info-value">${productionOrder.item_name_ar || productionOrder.item_name}</div>
                </div>
              ` : ''}
              
              ${productionOrder.size_caption ? `
                <div class="info-item full-width">
                  <div class="info-label">المقاس</div>
                  <div class="info-value">${productionOrder.size_caption}</div>
                </div>
              ` : ''}
            ` : ''}
            
            <div class="info-item">
              <div class="info-label">رقم الرول</div>
              <div class="info-value">#${roll.roll_seq}</div>
            </div>
            
            <div class="info-item">
              <div class="info-label">الوزن (كجم)</div>
              <div class="info-value">${roll.weight_kg != null ? parseFloat(String(roll.weight_kg)).toFixed(2) : '0.00'}</div>
            </div>
            
            ${roll.machine_id ? `
              <div class="info-item">
                <div class="info-label">رقم الماكينة</div>
                <div class="info-value">${roll.machine_id}</div>
              </div>
            ` : ''}
            
            ${roll.created_by_name ? `
              <div class="info-item">
                <div class="info-label">تم الإنشاء بواسطة</div>
                <div class="info-value">${roll.created_by_name}</div>
              </div>
            ` : ''}
            
            ${roll.created_at ? `
              <div class="info-item">
                <div class="info-label">تاريخ الإنشاء</div>
                <div class="info-value">${format(new Date(roll.created_at), 'dd/MM/yyyy HH:mm')}</div>
              </div>
            ` : ''}
            
            ${roll.printed_by_name ? `
              <div class="info-item">
                <div class="info-label">تم الطباعة بواسطة</div>
                <div class="info-value">${roll.printed_by_name}</div>
              </div>
            ` : ''}
            
            ${roll.printed_at ? `
              <div class="info-item">
                <div class="info-label">تاريخ الطباعة</div>
                <div class="info-value">${format(new Date(roll.printed_at), 'dd/MM/yyyy HH:mm')}</div>
              </div>
            ` : ''}
            
            ${roll.cut_by_name ? `
              <div class="info-item">
                <div class="info-label">تم التقطيع بواسطة</div>
                <div class="info-value">${roll.cut_by_name}</div>
              </div>
            ` : ''}
            
            ${roll.cut_at ? `
              <div class="info-item">
                <div class="info-label">تاريخ التقطيع</div>
                <div class="info-value">${format(new Date(roll.cut_at), 'dd/MM/yyyy HH:mm')}</div>
              </div>
            ` : ''}
            
            ${roll.cut_weight_total_kg != null ? `
              <div class="info-item">
                <div class="info-label">الوزن بعد التقطيع</div>
                <div class="info-value">${parseFloat(String(roll.cut_weight_total_kg)).toFixed(2)} كجم</div>
              </div>
            ` : ''}
          </div>
          
          <div class="status-box">
            الحالة: ${getStatusLabel(roll.status)}
          </div>
          
          <div class="footer">
            تمت الطباعة في: ${format(new Date(), 'dd/MM/yyyy - HH:mm:ss')}
          </div>
        </div>
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Use onload event to ensure content is fully loaded before printing
    // This is more reliable than setTimeout
    printWindow.onload = () => {
      printWindow.print();
    };
    
    // Fallback in case onload doesn't fire (e.g., for about:blank)
    // Only use setTimeout as a fallback, not primary method
    if (printWindow.document.readyState === 'complete') {
      printWindow.print();
    } else {
      setTimeout(() => {
        if (printWindow && !printWindow.closed) {
          printWindow.print();
        }
      }, 500);
    }
  }
}

export default function RollLabelButton({ roll, productionOrder, order, children }: RollLabelPrintProps & { children?: React.ReactNode }) {
  return (
    <button
      onClick={() => printRollLabel({ roll, productionOrder, order })}
      className="inline-flex items-center"
    >
      {children}
    </button>
  );
}
