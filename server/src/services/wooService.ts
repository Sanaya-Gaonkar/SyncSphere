import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import { prisma } from '../prisma.js';

// Default export wrapper for CommonJS compatibility
const WooCommerce = (WooCommerceRestApi as any).default || WooCommerceRestApi;

export interface WooConfig {
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
  apiVersion?: string;
  verifySsl?: boolean;
  isDemoMode?: boolean;
}

export class WooCommerceService {
  private static async getConfig(): Promise<WooConfig> {
    const settings = await prisma.settings.findUnique({ where: { id: 'default' } });
    if (!settings) {
      return {
        storeUrl: process.env.WOO_STORE_URL || 'https://demo-store.woocommerce.com',
        consumerKey: process.env.WOO_CONSUMER_KEY || 'ck_demo',
        consumerSecret: process.env.WOO_CONSUMER_SECRET || 'cs_demo',
        apiVersion: 'wc/v3',
        verifySsl: true,
        isDemoMode: true,
      };
    }
    return {
      storeUrl: settings.storeUrl,
      consumerKey: settings.consumerKey,
      consumerSecret: settings.consumerSecret,
      apiVersion: settings.apiVersion,
      verifySsl: settings.verifySsl,
      isDemoMode: settings.isDemoMode,
    };
  }

  private static getClient(config: WooConfig) {
    return new WooCommerce({
      url: config.storeUrl,
      consumerKey: config.consumerKey,
      consumerSecret: config.consumerSecret,
      version: config.apiVersion || 'wc/v3',
      queryStringAuth: true,
      axiosConfig: {
        timeout: 10000,
        headers: {
          'User-Agent': 'Sanaya-Gaonkar-PIM/1.0',
        },
      },
    });
  }

  static async testConnection(overrideConfig?: Partial<WooConfig>): Promise<{
    success: boolean;
    isSimulated: boolean;
    storeName: string;
    version: string;
    currency: string;
    message: string;
    pingMs: number;
  }> {
    const startTime = Date.now();
    const config = { ...(await this.getConfig()), ...(overrideConfig || {}) };

    // If Demo Mode is active or credentials are demo
    if (config.isDemoMode || config.consumerKey.startsWith('ck_demo') || !config.storeUrl || config.storeUrl.includes('demo')) {
      // Simulate realistic network latency
      await new Promise(r => setTimeout(r, 450));
      return {
        success: true,
        isSimulated: true,
        storeName: 'SyncSphere Simulated Demo Store (WooCommerce v8.6)',
        version: 'wc/v3 (Demo Sandbox)',
        currency: 'INR (₹)',
        message: 'Successfully verified connection to the Simulated WooCommerce Environment. Full CRUD & sync operations are supported.',
        pingMs: Date.now() - startTime,
      };
    }

    // Live WooCommerce REST API call
    try {
      const client = this.getClient(config);
      // Fetch system status or products limit 1 to verify credentials
      const response = await client.get('system_status');
      const pingMs = Date.now() - startTime;
      const data = response.data;
      return {
        success: true,
        isSimulated: false,
        storeName: data?.environment?.site_title || config.storeUrl,
        version: data?.environment?.version || 'wc/v3',
        currency: data?.settings?.currency || 'INR',
        message: 'Live connection verified successfully with WooCommerce store.',
        pingMs,
      };
    } catch (err: any) {
      // Attempt fallback verification using simple products query if system_status requires elevated permissions
      try {
        const client = this.getClient(config);
        const response = await client.get('products', { per_page: 1 });
        const pingMs = Date.now() - startTime;
        return {
          success: true,
          isSimulated: false,
          storeName: config.storeUrl,
          version: 'wc/v3',
          currency: 'INR',
          message: 'Live connection verified successfully (via Products endpoint).',
          pingMs,
        };
      } catch (innerErr: any) {
        throw new Error(
          innerErr.response?.data?.message ||
          innerErr.message ||
          'Failed to connect to WooCommerce store. Please verify Store URL and API Keys.'
        );
      }
    }
  }

  static async fetchRemoteProducts(params: { page?: number; per_page?: number } = {}): Promise<{
    products: any[];
    isSimulated: boolean;
    total: number;
  }> {
    const config = await this.getConfig();

    if (config.isDemoMode || config.consumerKey.startsWith('ck_demo')) {
      await new Promise(r => setTimeout(r, 600));
      // Return realistic simulated WooCommerce products
      const demoProducts = [
        {
          id: 1041,
          name: 'AcousticPro Studio Headphones Wireless',
          sku: 'AUD-AP-001',
          type: 'simple',
          status: 'publish',
          regular_price: '249.99',
          sale_price: '219.99',
          description: '<p>Engineered with custom 45mm neodymium drivers, active noise cancellation, and up to 40 hours of playback.</p>',
          short_description: 'Professional wireless studio monitors with hybrid active noise cancellation.',
          stock_quantity: 48,
          manage_stock: true,
          stock_status: 'instock',
          images: [
            { id: 1, src: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800' }
          ],
          categories: [{ id: 12, name: 'Audio' }, { id: 10, name: 'Electronics' }],
          tags: [{ id: 4, name: 'Wireless' }, { id: 5, name: 'Noise-Cancelling' }],
          attributes: [
            { name: 'Color', options: ['Matte Black', 'Silver'] },
            { name: 'Connectivity', options: ['Bluetooth 5.3', '3.5mm Aux'] }
          ],
          date_modified: new Date().toISOString(),
        },
        {
          id: 1042,
          name: 'Apex Mechanical Keyboard RGB (Hot-Swappable)',
          sku: 'TECH-MK-002',
          type: 'simple',
          status: 'publish',
          regular_price: '139.99',
          sale_price: '',
          description: '<p>TKL form factor featuring factory-lubed switches, sound-dampening foam, per-key RGB backlighting, and aluminum frame.</p>',
          short_description: 'Precision hot-swappable mechanical keyboard for power typists.',
          stock_quantity: 85,
          manage_stock: true,
          stock_status: 'instock',
          images: [
            { id: 2, src: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800' }
          ],
          categories: [{ id: 10, name: 'Electronics' }, { id: 14, name: 'Accessories' }],
          tags: [{ id: 6, name: 'RGB' }, { id: 7, name: 'Gaming' }],
          attributes: [
            { name: 'Switch Type', options: ['Linear Red', 'Tactile Brown'] },
            { name: 'Layout', options: ['ANSI 87-Key'] }
          ],
          date_modified: new Date().toISOString(),
        },
        {
          id: 1043,
          name: 'HydroPulse Insulated Smart Bottle 750ml',
          sku: 'HOME-HP-003',
          type: 'simple',
          status: 'publish',
          regular_price: '54.50',
          sale_price: '49.00',
          description: '<p>Double-wall vacuum insulation keeps liquids cold for 24h and hot for 12h. Integrated OLED temperature display in the lid.</p>',
          short_description: 'Smart thermal flask with real-time temperature sensing and hydration reminders.',
          stock_quantity: 12,
          manage_stock: true,
          stock_status: 'instock',
          images: [
            { id: 3, src: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800' }
          ],
          categories: [{ id: 11, name: 'Home & Kitchen' }],
          tags: [{ id: 8, name: 'Eco-Friendly' }],
          attributes: [
            { name: 'Color', options: ['Forest Green', 'Midnight Blue'] },
            { name: 'Capacity', options: ['750ml'] }
          ],
          date_modified: new Date().toISOString(),
        },
      ];
      return { products: demoProducts, isSimulated: true, total: demoProducts.length };
    }

    const client = this.getClient(config);
    const response = await client.get('products', {
      page: params.page || 1,
      per_page: params.per_page || 50,
    });

    const total = parseInt(response.headers['x-wp-total'] || '0', 10) || response.data.length;
    return {
      products: response.data,
      isSimulated: false,
      total,
    };
  }

  static async pushProduct(productData: any, remoteId?: number | null): Promise<{
    remoteId: number;
    isSimulated: boolean;
    rawResponse: any;
  }> {
    const config = await this.getConfig();

    const payload: any = {
      name: productData.name,
      sku: productData.sku,
      regular_price: productData.regularPrice ? productData.regularPrice.toString() : '0',
      description: productData.description || '',
      short_description: productData.shortDescription || '',
      manage_stock: productData.manageStock ?? true,
      stock_quantity: productData.stockQuantity ?? 0,
      stock_status: productData.stockStatus ? productData.stockStatus.toLowerCase() : 'instock',
    };

    if (productData.salePrice) {
      payload.sale_price = productData.salePrice.toString();
    } else {
      payload.sale_price = '';
    }

    if (Array.isArray(productData.images) && productData.images.length > 0) {
      payload.images = productData.images.map((src: string) => ({ src }));
    }

    if (Array.isArray(productData.categories) && productData.categories.length > 0) {
      payload.categories = productData.categories.map((c: any) =>
        typeof c === 'object' && c.name ? { name: c.name } : { name: String(c) }
      );
    }

    if (Array.isArray(productData.tags) && productData.tags.length > 0) {
      payload.tags = productData.tags.map((t: any) =>
        typeof t === 'object' && t.name ? { name: t.name } : { name: String(t) }
      );
    }

    if (Array.isArray(productData.attributes) && productData.attributes.length > 0) {
      payload.attributes = productData.attributes.map((a: any) => ({
        name: a.name,
        visible: true,
        variation: false,
        options: Array.isArray(a.values) ? a.values : [String(a.values)],
      }));
    }

    if (config.isDemoMode || config.consumerKey.startsWith('ck_demo')) {
      await new Promise(r => setTimeout(r, 650));
      const simulatedId = remoteId || (Math.floor(1000 + Math.random() * 9000));
      return {
        remoteId: simulatedId,
        isSimulated: true,
        rawResponse: {
          id: simulatedId,
          ...payload,
          date_modified: new Date().toISOString(),
          simulated: true,
        },
      };
    }

    const client = this.getClient(config);
    let response;
    if (remoteId) {
      response = await client.put(`products/${remoteId}`, payload);
    } else {
      response = await client.post('products', payload);
    }

    return {
      remoteId: response.data.id,
      isSimulated: false,
      rawResponse: response.data,
    };
  }

  static async deleteProduct(remoteId: number): Promise<{ success: boolean; isSimulated: boolean }> {
    const config = await this.getConfig();

    if (config.isDemoMode || config.consumerKey.startsWith('ck_demo')) {
      await new Promise(r => setTimeout(r, 300));
      return { success: true, isSimulated: true };
    }

    const client = this.getClient(config);
    await client.delete(`products/${remoteId}`, { force: true });
    return { success: true, isSimulated: false };
  }
}
