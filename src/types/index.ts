// User types
export type UserRole = 'superadmin' | 'admin' | 'customer';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  phoneNumber?: string;
  companyName?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// Menu item types
export interface MenuItem {
  id: string;
  name: string;
  category: string;
  description: string;
  basePrice: number;
  unit: string;
  isVegetarian: boolean;
  isVegan: boolean;
  allergens: string[];
  preparationTime: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Quote/Order types
export interface QuoteItem {
  menuItemId: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  total: number;
  specialInstructions?: string;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventType: string;
  eventDate: Date;
  eventTime: string;
  venue: string;
  guestCount: number;
  specialRequests?: string;
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  pdfUrl?: string;
}

// Pricing configuration types
export interface PricingRule {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  menuItemId?: string;
  minPersons?: number;
  maxPersons?: number;
  dateRangeStart?: Date;
  dateRangeEnd?: Date;
  priceMultiplier: number;
  fixedAmount?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Package types
export interface PackageTemplate {
  id: string;
  name: string;
  description?: string;
  items?: QuoteItem[];
  menuItems?: string[];
  basePrice: number;
  guestCount: number;
  category?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form types
export interface CustomerFormData {
  name: string;
  phone: string;
  email?: string;
  date: string;
  time: string;
  venue: string;
  persons: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  phoneNumber?: string;
  companyName?: string;
  role: UserRole;
}
