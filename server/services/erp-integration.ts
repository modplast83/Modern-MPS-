import { db } from "../db";
import { orders, customers, products, production_orders, items, warehouse_transactions } from "@shared/schema";
import { eq } from "drizzle-orm";

// ERP Integration Types
export interface ERPConfiguration {
  id: number;
  name: string;
  type: 'SAP' | 'Oracle' | 'Odoo' | 'QuickBooks' | 'Custom';
  endpoint: string;
  apiKey?: string;
  username?: string;
  password?: string;
  settings: Record<string, any>;
  isActive: boolean;
}

export interface ERPSyncLog {
  id: number;
  erpConfigId: number;
  entityType: string;
  entityId: number;
  operation: 'sync_in' | 'sync_out' | 'update' | 'delete';
  status: 'pending' | 'success' | 'failed' | 'partial';
  errorMessage?: string;
  syncedAt: Date;
  dataPayload: Record<string, any>;
}

// Base ERP Service Interface
export interface IERPService {
  syncCustomers(): Promise<{ success: number; failed: number; errors: string[] }>;
  syncProducts(): Promise<{ success: number; failed: number; errors: string[] }>;
  syncOrders(): Promise<{ success: number; failed: number; errors: string[] }>;
  syncInventory(): Promise<{ success: number; failed: number; errors: string[] }>;
  pushOrder(orderId: number): Promise<boolean>;
  pushCustomer(customerId: number): Promise<boolean>;
  validateConnection(): Promise<boolean>;
}

// SAP Integration Service
export class SAPIntegrationService implements IERPService {
  private config: ERPConfiguration;

  constructor(config: ERPConfiguration) {
    this.config = config;
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.endpoint}/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch (error) {
      console.error('SAP connection validation failed:', error);
      return false;
    }
  }

  async syncCustomers(): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0, failed = 0;
    const errors: string[] = [];

    try {
      // Fetch customers from SAP
      const response = await fetch(`${this.config.endpoint}/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`SAP API Error: ${response.statusText}`);
      }

      const data = await response.json();
      
      for (const sapCustomer of data.d.results) {
        try {
          // Check if customer exists
          const existingCustomer = await db.select()
            .from(customers)
            .where(eq(customers.tax_number, sapCustomer.TaxNumber))
            .limit(1);

          if (existingCustomer.length === 0) {
            // Create new customer
            await db.insert(customers).values({
              name: sapCustomer.BusinessPartnerName,
              name_ar: sapCustomer.BusinessPartnerName, // Would need translation service
              tax_number: sapCustomer.TaxNumber,
              phone: sapCustomer.PhoneNumber1,
              address: sapCustomer.StreetName,
              city: sapCustomer.CityName
            });
            success++;
          } else {
            // Update existing customer
            await db.update(customers)
              .set({
                name: sapCustomer.BusinessPartnerName,
                phone: sapCustomer.PhoneNumber1,
                address: sapCustomer.StreetName,
                city: sapCustomer.CityName
              })
              .where(eq(customers.tax_number, sapCustomer.TaxNumber));
            success++;
          }
        } catch (error) {
          failed++;
          errors.push(`Customer sync failed: ${error.message}`);
        }
      }
    } catch (error) {
      errors.push(`SAP customers sync failed: ${error.message}`);
    }

    return { success, failed, errors };
  }

  async syncProducts(): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0, failed = 0;
    const errors: string[] = [];

    try {
      // Fetch products from SAP
      const response = await fetch(`${this.config.endpoint}/sap/opu/odata/sap/API_PRODUCT/A_Product`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`SAP API Error: ${response.statusText}`);
      }

      const data = await response.json();
      
      for (const sapProduct of data.d.results) {
        try {
          // Check if product exists
          const existingProduct = await db.select()
            .from(products)
            .where(eq(products.name, sapProduct.Product))
            .limit(1);

          if (existingProduct.length === 0) {
            // Create new product
            await db.insert(products).values({
              name: sapProduct.ProductDescription,
              name_ar: sapProduct.ProductDescription, // Would need translation
              type: this.mapSAPProductType(sapProduct.ProductType),
              needs_printing: sapProduct.ProductType.includes('PRINT'),
              unit: sapProduct.BaseUnit
            });
            success++;
          }
        } catch (error) {
          failed++;
          errors.push(`Product sync failed: ${error.message}`);
        }
      }
    } catch (error) {
      errors.push(`SAP products sync failed: ${error.message}`);
    }

    return { success, failed, errors };
  }

  async syncOrders(): Promise<{ success: number; failed: number; errors: string[] }> {
    // Implementation for syncing orders from SAP
    return { success: 0, failed: 0, errors: [] };
  }

  async syncInventory(): Promise<{ success: number; failed: number; errors: string[] }> {
    // Implementation for syncing inventory from SAP
    return { success: 0, failed: 0, errors: [] };
  }

  async pushOrder(orderId: number): Promise<boolean> {
    try {
      const orderData = await db.select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (orderData.length === 0) return false;

      const order = orderData[0];
      
      // Transform order to SAP format
      const sapOrder = {
        SalesOrder: order.order_number,
        SoldToParty: order.customer_id.toString(),
        SalesOrderType: 'OR',
        SalesOrganization: '1000',
        DistributionChannel: '10',
        OrganizationDivision: '00'
      };

      const response = await fetch(`${this.config.endpoint}/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrder`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sapOrder)
      });

      return response.ok;
    } catch (error) {
      console.error('Push order to SAP failed:', error);
      return false;
    }
  }

  async pushCustomer(customerId: number): Promise<boolean> {
    // Implementation for pushing customer to SAP
    return true;
  }

  private mapSAPProductType(sapType: string): string {
    const typeMap: Record<string, string> = {
      'FERT': 'علاقي',
      'HALB': 'بنانة',
      'ROH': 'بدون تخريم'
    };
    return typeMap[sapType] || 'علاقي';
  }
}

// Odoo Integration Service
export class OdooIntegrationService implements IERPService {
  private config: ERPConfiguration;

  constructor(config: ERPConfiguration) {
    this.config = config;
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.endpoint}/web/session/authenticate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: {
            db: this.config.settings.database,
            login: this.config.username,
            password: this.config.password
          }
        })
      });
      
      const result = await response.json();
      return !result.error;
    } catch (error) {
      return false;
    }
  }

  async syncCustomers(): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0, failed = 0;
    const errors: string[] = [];

    try {
      // Authenticate first
      const authResponse = await this.authenticate();
      if (!authResponse.success) {
        errors.push('Odoo authentication failed');
        return { success, failed, errors };
      }

      // Fetch customers from Odoo
      const response = await fetch(`${this.config.endpoint}/web/dataset/search_read`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': authResponse.sessionId 
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: {
            model: 'res.partner',
            fields: ['name', 'phone', 'email', 'street', 'city', 'vat'],
            domain: [['is_company', '=', true]]
          }
        })
      });

      const data = await response.json();
      
      for (const odooCustomer of data.result.records) {
        try {
          await db.insert(customers).values({
            name: odooCustomer.name,
            name_ar: odooCustomer.name,
            phone: odooCustomer.phone,
            address: odooCustomer.street,
            city: odooCustomer.city,
            tax_number: odooCustomer.vat
          }).onConflictDoUpdate({
            target: customers.tax_number,
            set: {
              name: odooCustomer.name,
              phone: odooCustomer.phone,
              address: odooCustomer.street,
              city: odooCustomer.city
            }
          });
          success++;
        } catch (error) {
          failed++;
          errors.push(`Customer sync failed: ${error.message}`);
        }
      }
    } catch (error) {
      errors.push(`Odoo customers sync failed: ${error.message}`);
    }

    return { success, failed, errors };
  }

  async syncProducts(): Promise<{ success: number; failed: number; errors: string[] }> {
    // Similar implementation for products
    return { success: 0, failed: 0, errors: [] };
  }

  async syncOrders(): Promise<{ success: number; failed: number; errors: string[] }> {
    return { success: 0, failed: 0, errors: [] };
  }

  async syncInventory(): Promise<{ success: number; failed: number; errors: string[] }> {
    return { success: 0, failed: 0, errors: [] };
  }

  async pushOrder(orderId: number): Promise<boolean> {
    return true;
  }

  async pushCustomer(customerId: number): Promise<boolean> {
    return true;
  }

  private async authenticate(): Promise<{ success: boolean; sessionId?: string }> {
    try {
      const response = await fetch(`${this.config.endpoint}/web/session/authenticate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: {
            db: this.config.settings.database,
            login: this.config.username,
            password: this.config.password
          }
        })
      });
      
      const result = await response.json();
      if (result.error) {
        return { success: false };
      }
      
      const cookies = response.headers.get('set-cookie');
      return { success: true, sessionId: cookies };
    } catch (error) {
      return { success: false };
    }
  }
}

// ERP Integration Manager
export class ERPIntegrationManager {
  private services: Map<number, IERPService> = new Map();

  async getERPService(configId: number): Promise<IERPService | null> {
    if (this.services.has(configId)) {
      return this.services.get(configId)!;
    }

    // Load configuration from database
    const config = await this.loadERPConfiguration(configId);
    if (!config || !config.isActive) return null;

    let service: IERPService;
    
    switch (config.type) {
      case 'SAP':
        service = new SAPIntegrationService(config);
        break;
      case 'Odoo':
        service = new OdooIntegrationService(config);
        break;
      default:
        return null;
    }

    // Validate connection before caching
    const isValid = await service.validateConnection();
    if (!isValid) return null;

    this.services.set(configId, service);
    return service;
  }

  async syncAllSystems(): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    
    // Load all active ERP configurations
    const configs = await this.loadAllActiveConfigurations();
    
    for (const config of configs) {
      const service = await this.getERPService(config.id);
      if (!service) continue;

      try {
        const syncResults = {
          customers: await service.syncCustomers(),
          products: await service.syncProducts(),
          orders: await service.syncOrders(),
          inventory: await service.syncInventory()
        };
        
        results[config.name] = syncResults;
        
        // Log sync results
        await this.logSyncOperation(config.id, 'bulk_sync', 'success', syncResults);
      } catch (error) {
        results[config.name] = { error: error.message };
        await this.logSyncOperation(config.id, 'bulk_sync', 'failed', { error: error.message });
      }
    }

    return results;
  }

  private async loadERPConfiguration(configId: number): Promise<ERPConfiguration | null> {
    // This would load from a database table for ERP configurations
    // For now, return a mock configuration
    return {
      id: configId,
      name: 'SAP Production',
      type: 'SAP',
      endpoint: 'https://sap-server.company.com:8000',
      username: 'SAP_USER',
      password: 'SAP_PASS',
      settings: { client: '100', language: 'EN' },
      isActive: true
    };
  }

  private async loadAllActiveConfigurations(): Promise<ERPConfiguration[]> {
    // Mock configurations for demo
    return [
      {
        id: 1,
        name: 'SAP Production',
        type: 'SAP',
        endpoint: 'https://sap-server.company.com:8000',
        username: 'SAP_USER',
        password: 'SAP_PASS',
        settings: { client: '100', language: 'EN' },
        isActive: true
      },
      {
        id: 2,
        name: 'Odoo CRM',
        type: 'Odoo',
        endpoint: 'https://odoo.company.com',
        username: 'admin',
        password: 'admin',
        settings: { database: 'production' },
        isActive: true
      }
    ];
  }

  private async logSyncOperation(
    erpConfigId: number, 
    operation: string, 
    status: string, 
    data: any
  ): Promise<void> {
    // This would log to a sync_logs table
    console.log(`ERP Sync Log: Config ${erpConfigId}, Operation: ${operation}, Status: ${status}`, data);
  }
}

export const erpIntegrationManager = new ERPIntegrationManager();