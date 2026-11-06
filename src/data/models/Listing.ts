export type ListingStatus = 'available' | 'sold' | 'rented';
export type TransactionType = 'sale' | 'rent';

export interface Listing {
  id: string;
  title: string;
  description?: string;
  price: number;
  propertyType?: string;
  transactionType: TransactionType;
  surface?: number;
  rooms?: number;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  photos: string[];
  status: ListingStatus;
  sellerId: string;
  createdAt?: unknown;
}
