export interface Product {
  id: number;
  name: string;
  description?: string;
  price: string | number;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
}

export interface Order {
  id: number;
  userSub: string;
  userEmail?: string;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: string | number;
  status: string;
  createdAt: string;
}

export interface AnalyticsSummary {
  productCount: number;
  inventoryValue: number;
  orderCount: number;
  confirmedOrders: number;
}

export interface EmailNotification {
  id: number;
  orderId: number;
  recipientEmail?: string;
  emailSubject: string;
  emailTemplate?: string;
  status: "pending" | "sent" | "failed" | "skipped";
  errorMessage?: string;
  sentAt?: string;
  createdAt: string;
}

export interface UserProfileView {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}
