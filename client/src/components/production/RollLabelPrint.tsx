import { format } from "date-fns";

interface RollLabelPrintProps {
  roll: {
    id: number;
    roll_number: string;
    roll_seq: number;
    weight_kg: number;
    machine_id?: string;
    film_machine_id?: string;
    printing_machine_id?: string;
    cutting_machine_id?: string;
    film_machine_name?: string;
    printing_machine_name?: string;
    cutting_machine_name?: string;
    qr_code_text?: string;
    qr_png_base64?: string;
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
    color?: string;
    raw_material?: string;
    punching?: string;
  };
  order?: {
    order_number: string;
    customer_name?: string;
    customer_name_ar?: string;
  };
}

export function printRollLabel({ roll, productionOrder, order }: RollLabelPrintProps) {
  const printContent = `
    <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>ليبل رول - ${roll.roll_number}</title>
        <style>
          @page {
            size: 4in 6in;
            margin: 0;
          }
          
          body {
            font-family: 'Arial', 'Segoe UI', sans-serif;
            direction: rtl;
            margin: 0;
            padding: 0;
            width: 4in;
            height: 6in;
            font-size: 11pt;
            color: #000;
            background: white;
          }
          
          .label-container {
            width: 100%;
            height: 100%;
            padding: 8mm;
            box-sizing: border-box;
            border: 3px solid #000;
            display: flex;
            flex-direction: column;
          }
          
          .header {
            text-align: center;
            border-bottom: 3px solid #000;
            padding-bottom: 4mm;
            margin-bottom: 4mm;
          }
          
          .company-name {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 2mm;
            color: #000;
          }
          
          .roll-number {
            font-size: 18pt;
            font-weight: bold;
            background: #000;
            color: #fff;
            padding: 2mm 4mm;
            margin-top: 2mm;
            border-radius: 2mm;
          }
          
          .qr-section {
            text-align: center;
            margin: 4mm 0;
            padding: 3mm;
            border: 2px solid #333;
            background: #f9f9f9;
          }
          
          .qr-image {
            max-width: 80px;
            max-height: 80px;
            margin: 0 auto;
          }
          
          .main-info {
            flex: 1;
            display: grid;
            grid-template-columns: 1fr;
            gap: 3mm;
            margin: 3mm 0;
          }
          
          .info-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 3mm;
          }
          
          .info-box {
            border: 2px solid #333;
            padding: 2.5mm;
            background: #fff;
            min-height: 12mm;
          }
          
          .info-box.full {
            grid-column: 1 / -1;
          }
          
          .info-box.highlight {
            background: #ffe6e6;
            border-color: #c00;
          }
          
          .info-label {
            font-size: 8pt;
            color: #666;
            font-weight: 600;
            margin-bottom: 1mm;
            text-transform: uppercase;
          }
          
          .info-value {
            font-size: 12pt;
            font-weight: bold;
            color: #000;
            line-height: 1.2;
          }
          
          .footer {
            margin-top: auto;
            padding-top: 3mm;
            border-top: 2px solid #333;
            text-align: center;
            font-size: 8pt;
            color: #666;
          }
          
          @media print {
            body { 
              margin: 0; 
              padding: 0;
            }
            .label-container { 
              page-break-after: always;
              border: 3px solid #000;
            }
            @page {
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="label-container">
          <!-- Header -->
          <div class="header">
            <div class="company-name">نظام إدارة إنتاج الأكياس البلاستيكية</div>
            <div class="roll-number">${roll.roll_number}</div>
          </div>
          
          <!-- QR Code Section -->
          ${roll.qr_png_base64 || roll.qr_code_text ? `
            <div class="qr-section">
              ${roll.qr_png_base64 ? `
                <img src="data:image/png;base64,${roll.qr_png_base64}" class="qr-image" alt="QR Code">
              ` : roll.qr_code_text ? `
                <div style="font-family: monospace; font-size: 9pt; font-weight: bold;">
                  ${roll.qr_code_text}
                </div>
              ` : ''}
            </div>
          ` : ''}
          
          <!-- Main Information -->
          <div class="main-info">
            <!-- Customer Name -->
            ${order && (order.customer_name_ar || order.customer_name) ? `
              <div class="info-box full">
                <div class="info-label">العميل</div>
                <div class="info-value">${order.customer_name_ar || order.customer_name}</div>
              </div>
            ` : ''}
            
            <!-- Production Order Number & Roll Sequence -->
            <div class="info-row">
              ${productionOrder ? `
                <div class="info-box">
                  <div class="info-label">أمر الإنتاج</div>
                  <div class="info-value">${productionOrder.production_order_number}</div>
                </div>
              ` : ''}
              
              <div class="info-box">
                <div class="info-label">رقم الرول</div>
                <div class="info-value">#${roll.roll_seq}</div>
              </div>
            </div>
            
            <!-- Product Name -->
            ${productionOrder && (productionOrder.item_name_ar || productionOrder.item_name) ? `
              <div class="info-box full">
                <div class="info-label">المنتج</div>
                <div class="info-value">${productionOrder.item_name_ar || productionOrder.item_name}</div>
              </div>
            ` : ''}
            
            <!-- Size & Color -->
            <div class="info-row">
              ${productionOrder && productionOrder.size_caption ? `
                <div class="info-box">
                  <div class="info-label">المقاس</div>
                  <div class="info-value">${productionOrder.size_caption}</div>
                </div>
              ` : ''}
              
              ${productionOrder && productionOrder.color ? `
                <div class="info-box">
                  <div class="info-label">اللون</div>
                  <div class="info-value">${productionOrder.color}</div>
                </div>
              ` : ''}
            </div>
            
            <!-- Raw Material & Punching -->
            <div class="info-row">
              ${productionOrder && productionOrder.raw_material ? `
                <div class="info-box">
                  <div class="info-label">المادة الخام</div>
                  <div class="info-value">${productionOrder.raw_material}</div>
                </div>
              ` : ''}
              
              ${productionOrder && productionOrder.punching ? `
                <div class="info-box">
                  <div class="info-label">التخريم</div>
                  <div class="info-value">${productionOrder.punching}</div>
                </div>
              ` : ''}
            </div>
            
            <!-- Weight -->
            <div class="info-box highlight full">
              <div class="info-label">الوزن الكلي</div>
              <div class="info-value">${roll.weight_kg != null ? parseFloat(String(roll.weight_kg)).toFixed(2) : '0.00'} كجم</div>
            </div>
            
            <!-- Operators Section -->
            <div class="info-row">
              ${roll.created_by_name ? `
                <div class="info-box">
                  <div class="info-label">مشغل الفيلم</div>
                  <div class="info-value">${roll.created_by_name}</div>
                </div>
              ` : ''}
              
              ${roll.printed_by_name ? `
                <div class="info-box">
                  <div class="info-label">مشغل الطباعة</div>
                  <div class="info-value">${roll.printed_by_name}</div>
                </div>
              ` : ''}
            </div>
            
            ${roll.cut_by_name ? `
              <div class="info-box full">
                <div class="info-label">مشغل التقطيع</div>
                <div class="info-value">${roll.cut_by_name}</div>
              </div>
            ` : ''}
            
            <!-- Machine Information -->
            ${roll.film_machine_name || roll.printing_machine_name || roll.cutting_machine_name || roll.machine_id ? `
              <div class="info-row">
                ${roll.film_machine_name ? `
                  <div class="info-box">
                    <div class="info-label">ماكينة الفيلم</div>
                    <div class="info-value">${roll.film_machine_name}</div>
                  </div>
                ` : roll.machine_id ? `
                  <div class="info-box">
                    <div class="info-label">الماكينة</div>
                    <div class="info-value">${roll.machine_id}</div>
                  </div>
                ` : ''}
                
                ${roll.printing_machine_name ? `
                  <div class="info-box">
                    <div class="info-label">ماكينة الطباعة</div>
                    <div class="info-value">${roll.printing_machine_name}</div>
                  </div>
                ` : ''}
              </div>
              
              ${roll.cutting_machine_name ? `
                <div class="info-box full">
                  <div class="info-label">ماكينة التقطيع</div>
                  <div class="info-value">${roll.cutting_machine_name}</div>
                </div>
              ` : ''}
            ` : ''}
            
            <!-- Creation Date -->
            ${roll.created_at ? `
              <div class="info-box full">
                <div class="info-label">تاريخ الإنتاج</div>
                <div class="info-value">${format(new Date(roll.created_at), 'dd/MM/yyyy - HH:mm')}</div>
              </div>
            ` : ''}
          </div>
          
          <!-- Footer -->
          <div class="footer">
            طُبع في: ${format(new Date(), 'dd/MM/yyyy - HH:mm')}
          </div>
        </div>
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    printWindow.onload = () => {
      printWindow.print();
    };
    
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
