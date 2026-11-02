export type ProductStatus = 'draft' | 'published' | 'archived';

export interface ProductVariation {
  id: string;
  name: string; // e.g. "Color", "Size", "Finish"
  options: string[]; // e.g. ["Champagne Gold", "Rose Gold", "Silver"]
  perOptionStock?: Record<string, number>;
  optionAvailability?: Record<string, boolean>;
  sku?: string;
}

export interface ProductAttribute {
  id?: string;
  key: string; // e.g. "Material", "Dimensions", "Weight", "Care Instructions"
  value: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  sku: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  categoryName?: string;
  tags: string[];
  status: ProductStatus;
  isFeatured: boolean;
  images: string[]; // URLs or base64 data URLs
  videoUrl?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number; // Private admin field
  currency: 'PKR';
  trackInventory: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  allowBackorders: boolean;
  variations: ProductVariation[];
  attributes: ProductAttribute[];
  createdAt: string;
  updatedAt: string;
  orderCount?: number; // Computed from real orders
  rating?: number;
  reviewCount?: number;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus =
  | 'unpaid'
  | 'awaiting_verification'
  | 'paid'
  | 'refunded';

export type PaymentMethod =
  | 'easypaisa'
  | 'jazzcash'
  | 'cod'
  | 'bank_transfer';

export interface OrderItem {
  id?: string;
  productId: string;
  productName: string;
  sku?: string;
  productSlug: string;
  productImage: string;
  variationText?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderTimelineEvent {
  id: string;
  timestamp: string;
  status: OrderStatus | PaymentStatus;
  title: string;
  description?: string;
  actor: 'customer' | 'admin' | 'system';
  messageKey?: string;
  messageCategory?: 'order_received' | 'order_status' | 'payment_status' | 'payment_receipt';
  messageCycleStart?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "MG-491823"
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerCity: string;
  deliveryAddress: string;
  deliveryInstructions?: string;
  giftMessage?: string;
  items: OrderItem[];
  idempotencyKey?: string;
  requestFingerprint?: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentProofUrl?: string;
  customerAccessTokenHash?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  timeline: OrderTimelineEvent[];
}

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  maxStock: number;
  selectedVariation?: string;
  trackInventory: boolean;
}

export interface StoreSettings {
  id?: string;
  storeName: string;
  tagline: string;
  supportingCopy: string;
  aboutUs: string;
  logoUrl: string;
  contactEmail: string;
  whatsappNumber: string;
  easypaisaNumber: string;
  easypaisaTitle: string;
  easypaisaEnabled: boolean;
  jazzcashNumber: string;
  jazzcashTitle: string;
  jazzcashEnabled: boolean;
  bankDetails: string;
  bankTransferEnabled: boolean;
  cashOnDeliveryEnabled: boolean;
  defaultCurrency: 'PKR';
  flatDeliveryFee: number;
  freeDeliveryThreshold: number;
  supportedCities: string[];
  businessHours: string;
  processingTime: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  announcementText: string;
  announcementEnabled: boolean;
  bestsellerMinOrders: number;
  policies: {
    returns: string;
    shipping: string;
    privacy: string;
    terms: string;
  };
}

export interface Review {
  id: string;
  productId: string;
  customerName: string;
  rating: number; // 1-5
  comment: string;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  createdAt: string;
}

export interface SalesAnalyticsSummary {
  totalRevenue: number; // Confirmed orders
  pendingRevenue: number;
  grossRevenue: number;
  totalOrders: number;
  pendingOrdersCount: number;
  confirmedOrdersCount: number;
  cancelledOrdersCount: number;
  totalOrderedQuantity: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalProductsCount: number;
  publishedProductsCount: number;
  draftProductsCount: number;
  bestsellers: {
    productId: string;
    productName: string;
    image: string;
    totalQuantity: number;
    totalRevenue: number;
  }[];
  recentOrders: Order[];
  dailyTrends: {
    date: string;
    orders: number;
    revenue: number;
  }[];
}
