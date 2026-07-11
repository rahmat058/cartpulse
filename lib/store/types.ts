import type { CartState } from '@/lib/types/cart'
import type { WishlistState } from '@/types/commerce'

export interface RootState {
  cart: CartState
  wishlist: WishlistState
}
