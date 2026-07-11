import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import type { Product } from '@/types/cart'
import type { WishlistState } from '@/types/commerce'

const initialState: WishlistState = {
  productIds: [],
  productsById: {},
  status: 'idle',
  error: null,
  hydrated: false,
}

async function fetchProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return []
  const response = await fetch(`/api/products?ids=${ids.join(',')}`)
  if (!response.ok) return []
  const json = (await response.json()) as { data: Product[] }
  return json.data ?? []
}

export const hydrateWishlist = createAsyncThunk('wishlist/hydrate', async (authenticated: boolean) => {
  if (!authenticated) {
    return { productIds: [] as string[], products: [] as Product[] }
  }

  const response = await fetch('/api/wishlist')
  if (!response.ok) throw new Error('Failed to load wishlist')
  const json = (await response.json()) as {
    productIds: string[]
    data: Array<{ product: Product }>
  }
  const products = json.data?.map((row) => row.product) ?? []
  return { productIds: json.productIds, products }
})

export const addToWishlist = createAsyncThunk(
  'wishlist/add',
  async ({ productId, product }: { productId: string; product?: Product }) => {
    const response = await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, ensure: true }),
    })
    if (!response.ok) {
      const body = (await response.json()) as { error?: string }
      throw new Error(body.error ?? 'Failed to add to wishlist')
    }
    const json = (await response.json()) as { wished: boolean; productIds: string[] }
    let resolvedProduct = product
    if (!resolvedProduct) {
      const products = await fetchProductsByIds([productId])
      resolvedProduct = products[0]
    }
    return {
      productId,
      productIds: json.productIds,
      product: resolvedProduct,
    }
  },
)

export const toggleWishlist = createAsyncThunk(
  'wishlist/toggle',
  async ({ productId, product }: { productId: string; product?: Product }) => {
    const response = await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    })
    if (!response.ok) {
      const body = (await response.json()) as { error?: string }
      throw new Error(body.error ?? 'Failed to update wishlist')
    }
    const json = (await response.json()) as { wished: boolean; productIds: string[] }
    return {
      productId,
      wished: json.wished,
      productIds: json.productIds,
      product: json.wished ? product : undefined,
      remove: !json.wished,
    }
  },
)

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    setWishlistIds(state, action: PayloadAction<string[]>) {
      state.productIds = action.payload
      state.hydrated = true
    },
    upsertWishlistProducts(state, action: PayloadAction<Product[]>) {
      for (const product of action.payload) {
        state.productsById[product.id] = product
      }
    },
    clearWishlist(state) {
      state.productIds = []
      state.productsById = {}
      state.hydrated = true
      state.status = 'idle'
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateWishlist.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(hydrateWishlist.fulfilled, (state, action) => {
        state.productIds = action.payload.productIds
        state.productsById = Object.fromEntries(
          action.payload.products.map((product) => [product.id, product]),
        )
        state.status = 'succeeded'
        state.hydrated = true
        state.error = null
      })
      .addCase(hydrateWishlist.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message ?? 'Failed to load wishlist'
        state.hydrated = true
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.productIds = action.payload.productIds
        state.status = 'succeeded'
        state.error = null
        if (action.payload.product) {
          state.productsById[action.payload.product.id] = action.payload.product
        }
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        state.error = action.error.message ?? 'Failed to add to wishlist'
      })
      .addCase(toggleWishlist.fulfilled, (state, action) => {
        state.productIds = action.payload.productIds
        state.status = 'succeeded'
        state.error = null
        if (action.payload.remove) {
          delete state.productsById[action.payload.productId]
        } else if (action.payload.product) {
          state.productsById[action.payload.product.id] = action.payload.product
        }
      })
      .addCase(toggleWishlist.rejected, (state, action) => {
        state.error = action.error.message ?? 'Failed to update wishlist'
      })
  },
})

export const { setWishlistIds, upsertWishlistProducts, clearWishlist } = wishlistSlice.actions
export default wishlistSlice.reducer
