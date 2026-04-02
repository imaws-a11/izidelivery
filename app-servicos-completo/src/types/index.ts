export interface SavedAddress {
  id: string | number;
  label: string;
  street: string;
  address?: string;
  details: string;
  city: string;
  active: boolean;
}

export interface Order {
  id: string;
  realId: string;
  type: string;
  origin: string;
  destination: string;
  price: number;
  customer: string;
  status?: string;
  pickup_lat?: number;
  pickup_lng?: number;
  delivery_lat?: number;
  delivery_lng?: number;
  driver_id?: string;
  total_price?: number;
  created_at?: string;
}

export interface Quest {
  id: number;
  title: string;
  desc: string;
  xp: number;
  progress: number;
  total: number;
  icon: string;
  color: string;
}

export interface Establishment {
  id: number;
  name: string;
  type: "restaurant" | "market" | "beverage" | "pharmacy";
  img: string;
  rating: number;
  time: string;
  tag: string;
  freeDelivery?: boolean;
}
