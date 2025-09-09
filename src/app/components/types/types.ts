export interface Category {
  id: number;
  name: string;
  image:string;
  items?: string;
}

export interface Product {
  id: Int, 
  name:string,
  originalPrice: number,
  price: number, 
  image: string,
  rating:number,
  reviews:string,
  isNew:boolean
}
