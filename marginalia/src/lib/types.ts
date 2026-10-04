export type Role = 'member' | 'admin'
export type ReadingStatus = 'unread' | 'reading' | 'read'
export type BookFormat = 'physical' | 'digital'
export type BookCondition = 'new' | 'fine' | 'good' | 'worn'
export type PostKind = 'thought' | 'review' | 'idea'
export type ListingStatus = 'active' | 'reserved' | 'sold' | 'withdrawn'
export type TransactionStatus = 'pending' | 'paid' | 'cancelled' | 'refund_due' | 'refunded'

export interface Profile {
  id: string
  username: string
  display_name: string
  bio: string | null
  city: string | null
  avatar_url: string | null
  role: Role
  created_at: string
  onboarded_at: string | null
}

export type Author = Pick<Profile, 'username' | 'display_name'>

export interface Book {
  id: string
  isbn: string | null
  title: string
  author: string
  published_year: number | null
  cover_url: string | null
}

export type BookRef = Pick<Book, 'id' | 'title' | 'author'>

export interface Listing {
  id: string
  shelf_item_id: string | null
  seller_id: string
  book_id: string
  price_minor: number
  currency: string
  format: BookFormat
  condition: BookCondition | null
  description: string | null
  status: ListingStatus
  created_at: string
}

export interface ListingWithBook extends Listing {
  book: Book
  seller: Author
}

export interface ShelfItem {
  id: string
  owner_id: string
  reading_status: ReadingStatus
  open_to_swap: boolean
  format: BookFormat
  condition: BookCondition | null
  note: string | null
  created_at: string
  book: Book
  listings: Pick<Listing, 'id' | 'status' | 'price_minor' | 'currency'>[]
}

export interface Transaction {
  id: string
  status: TransactionStatus
  amount_minor: number
  commission_bps: number
  commission_minor: number
  seller_net_minor: number
  currency: string
  provider: 'manual' | 'chargily'
  checkout_url: string | null
  created_at: string
  paid_at: string | null
  paid_out_at: string | null
  buyer_id: string
  seller_id: string
  listing: { id: string; book: Pick<Book, 'title' | 'author'> }
  buyer: Author
  seller: Author
}

export interface Post {
  id: string
  author_id: string
  kind: PostKind
  rating: number | null
  body: string
  created_at: string
  author: Author
  book: BookRef | null
  comments: { count: number }[]
}

export interface Comment {
  id: string
  author_id: string
  body: string
  created_at: string
  author: Author
}

export interface Room {
  id: string
  kind: 'public' | 'direct'
  name: string | null
  description: string | null
  message_ttl: string
}

export interface Message {
  id: number
  room_id: string
  author_id: string
  body: string
  created_at: string
  expires_at: string
}

export interface Settings {
  commission_bps: number
  currency: string
}
