// PostgREST select strings shared between pages. FK hints avoid ambiguity
// where two paths join the same tables.

export const POST_SELECT =
  'id, kind, body, rating, created_at, author_id, author:profiles(username, display_name), book:books(id, title, author), comments(count)'

export const SHELF_SELECT =
  'id, owner_id, reading_status, open_to_swap, format, condition, note, created_at, book:books!shelf_items_book_id_fkey(id, isbn, title, author, published_year, cover_url), listings(id, status, price_minor, currency)'

export const LISTING_SELECT =
  'id, shelf_item_id, seller_id, book_id, price_minor, currency, format, condition, description, status, created_at, book:books!listings_book_id_fkey(id, isbn, title, author, published_year, cover_url), seller:profiles(username, display_name)'

export const TRANSACTION_SELECT =
  'id, status, amount_minor, commission_bps, commission_minor, seller_net_minor, currency, provider, checkout_url, created_at, paid_at, paid_out_at, buyer_id, seller_id, listing:listings(id, book:books!listings_book_id_fkey(title, author)), buyer:profiles!transactions_buyer_id_fkey(username, display_name), seller:profiles!transactions_seller_id_fkey(username, display_name)'
