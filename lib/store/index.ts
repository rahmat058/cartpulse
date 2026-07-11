import { configureStore } from '@reduxjs/toolkit'
import cartReducer from '@/lib/store/slices/cartSlice'
import wishlistReducer from '@/lib/store/slices/wishlistSlice'

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    wishlist: wishlistReducer,
  },
})

export type { RootState } from '@/lib/store/types'
export type AppDispatch = typeof store.dispatch
