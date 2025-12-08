export interface Location {
  _id: string;
  name: string;
  city: string;
  isActive: boolean;
}

export interface Category {
  _id: string;
  name: string;
  icon: string;
  isActive: boolean;
}

export interface Shop {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  location: Location;
  category: Category;
  address?: string;
  phone?: string;
  isActive: boolean;
}

export interface Deal {
  _id: string;
  title: string;
  description: string;
  discount?: string;
  shop: Shop;
  category: Category;
  location: Location;
  image?: string;
  validFrom?: Date;
  validTo?: Date;
  termsAndConditions?: string;
  isActive: boolean;
  isPremium?: boolean;
}

export interface Banner {
  _id: string;
  title?: string;
  image: string;
  link?: string;
  order?: number;
  isActive: boolean;
}

