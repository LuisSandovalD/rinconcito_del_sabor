export type StorefrontProduct = {
  id: string;
  name: string;
  description?: string;
  price: string;
  imageUrl?: string;
  estimatedMinutes?: number;
  availability: string;
  featured: boolean;
};

export type StorefrontCategory = {
  id: string;
  name: string;
  products: StorefrontProduct[];
};

export type StorefrontMenu = {
  settings: {
    tradeName: string;
    address?: string;
    phone?: string;
    logoUrl?: string;
    orderingEnabled: boolean;
  };
  categories: StorefrontCategory[];
};

export type CartLine = {
  product: StorefrontProduct;
  quantity: number;
};

export type CheckoutData = {
  type: "TAKEAWAY" | "DELIVERY";
  deliveryAddress: string;
  deliveryReference: string;
  deliveryLatitude: number | null;
  deliveryLongitude: number | null;
  deliveryAccuracy: number | null;
  recipientType: "SELF" | "OTHER";
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  notes: string;
};

export type PublicOrderResult = {
  id: string;
  number: number;
  status: string;
  type: "TAKEAWAY" | "DELIVERY";
  total: string;
  consentPending: boolean;
  consentNotificationDelivered?: boolean;
};

export type StorefrontUser = {
  id: string;
  name: string;
  firstName: string;
  email: string;
  phone: string;
};

export type TableOrderResult = {
  id: string;
  number: number;
  status: string;
  tableNumber: number;
  total: string;
};

export type PublicTableZone = {
  id: string;
  name: string;
  tables: Array<{
    id: string;
    number: number;
    name?: string;
    capacity: number;
    status: string;
  }>;
};
