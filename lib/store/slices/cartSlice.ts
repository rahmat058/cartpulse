import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { fetchProducts } from '@/lib/services/products-client'
import type { CartState, CatalogSortBy, CatalogViewMode, Product, ProductCategory, ProductsResponse } from '@/types/cart'
import type { CouponDefinition } from '@/types/commerce'
import type { CatalogQueryParams } from '@/types/cart'
import {
  DEFAULT_ADVANCED_FILTERS,
  getCartLineKey,
  getProductStock,
} from '@/types/cart'
import { clampQuantity } from '@/lib/utils/cartPricing'
import { getCatalogPriceBounds } from '@/lib/utils/productCatalog'

const initialState: CartState = {
  productsById: {},
  catalogResultIds: [],
  catalogTotal: 0,
  catalogPriceBounds: { min: 0, max: 500 },
  catalogPriceBoundsReady: false,
  meta: null,
  itemsById: {},
  promoCode: null,
  appliedCoupon: null,
  categoryFilter: 'all',
  advancedFilters: { ...DEFAULT_ADVANCED_FILTERS },
  catalogStatus: 'idle',
  catalogError: null,
  restoredFromStorage: false,
}

function expandPriceBounds(state: CartState, products: Product[]) {
  if (products.length === 0) return
  const bounds = getCatalogPriceBounds(products)
  if (!state.catalogPriceBoundsReady) {
    state.catalogPriceBounds = bounds
    state.catalogPriceBoundsReady = true
    return
  }
  state.catalogPriceBounds = {
    min: Math.min(state.catalogPriceBounds.min, bounds.min),
    max: Math.max(state.catalogPriceBounds.max, bounds.max),
  }
}

function applyCatalogResults(state: CartState, payload: ProductsResponse) {
  state.catalogStatus = 'succeeded'
  state.meta = payload.meta
  mergeProducts(state, payload.data)
  state.catalogResultIds = payload.data.map((product) => product.id)
  state.catalogTotal = payload.meta.totalProducts
  state.catalogError = null
  expandPriceBounds(state, payload.data)
  reconcileCartLines(state)
}

export interface AddItemPayload {
  productId: string
  variantId?: string
  product?: Product
}

export const loadProductCatalog = createAsyncThunk(
  'cart/loadCatalog',
  async (query: CatalogQueryParams | undefined, { signal }) => {
    return fetchProducts(query ?? {}, signal)
  },
)

/** Soft reconcile: clamp qty / drop out-of-stock, but keep lines whose products aren't loaded yet. */
function reconcileCartLines(state: CartState) {
  for (const [lineKey, line] of Object.entries(state.itemsById)) {
    const product = state.productsById[line.productId]
    if (!product) continue

    const stock = getProductStock(product, line.variantId)
    if (stock < 1) {
      delete state.itemsById[lineKey]
      continue
    }

    line.quantity = clampQuantity(line.quantity, stock)
  }
}

function mergeProducts(state: CartState, products: Product[]) {
  for (const product of products) {
    state.productsById[product.id] = product
  }
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<AddItemPayload>) {
      const { productId, variantId, product: payloadProduct } = action.payload
      if (payloadProduct) {
        state.productsById[payloadProduct.id] = payloadProduct
      }

      const product = state.productsById[productId]
      const stock = product ? getProductStock(product, variantId) : 0
      if (!product || stock < 1) return

      const lineKey = getCartLineKey(productId, variantId)
      const existing = state.itemsById[lineKey]
      if (existing) {
        existing.quantity = clampQuantity(existing.quantity + 1, stock)
      } else {
        state.itemsById[lineKey] = { productId, variantId, quantity: 1 }
      }
    },
    removeItem(state, action: PayloadAction<string>) {
      delete state.itemsById[action.payload]
    },
    setQuantity(
      state,
      action: PayloadAction<{ lineKey: string; productId: string; variantId?: string; quantity: number }>,
    ) {
      const { lineKey, productId, variantId, quantity } = action.payload
      const product = state.productsById[productId]
      if (!product || !state.itemsById[lineKey]) return

      if (quantity <= 0) {
        delete state.itemsById[lineKey]
        return
      }

      const stock = getProductStock(product, variantId)
      state.itemsById[lineKey].quantity = clampQuantity(quantity, stock)
    },
    incrementQuantity(state, action: PayloadAction<string>) {
      const lineKey = action.payload
      const line = state.itemsById[lineKey]
      if (!line) return

      const product = state.productsById[line.productId]
      if (!product) return

      const stock = getProductStock(product, line.variantId)
      line.quantity = clampQuantity(line.quantity + 1, stock)
    },
    decrementQuantity(state, action: PayloadAction<string>) {
      const lineKey = action.payload
      const line = state.itemsById[lineKey]
      if (!line) return

      if (line.quantity <= 1) {
        delete state.itemsById[lineKey]
      } else {
        line.quantity -= 1
      }
    },
    clearCart(state) {
      state.itemsById = {}
      state.promoCode = null
      state.appliedCoupon = null
    },
    applyPromoCode(state, action: PayloadAction<{ code: string; coupon: CouponDefinition }>) {
      const code = action.payload.code.trim().toUpperCase()
      if (!code) return
      state.promoCode = code
      state.appliedCoupon = action.payload.coupon
    },
    clearPromoCode(state) {
      state.promoCode = null
      state.appliedCoupon = null
    },
    setCategoryFilter(state, action: PayloadAction<ProductCategory>) {
      state.categoryFilter = action.payload
    },
    setPriceRange(state, action: PayloadAction<{ min: number; max: number }>) {
      if (
        state.advancedFilters.priceMin === action.payload.min &&
        state.advancedFilters.priceMax === action.payload.max
      ) {
        return
      }
      state.advancedFilters.priceMin = action.payload.min
      state.advancedFilters.priceMax = action.payload.max
    },
    setMinRating(state, action: PayloadAction<number>) {
      state.advancedFilters.minRating = action.payload
    },
    setInStockOnly(state, action: PayloadAction<boolean>) {
      state.advancedFilters.inStockOnly = action.payload
    },
    setSortBy(state, action: PayloadAction<CatalogSortBy>) {
      state.advancedFilters.sortBy = action.payload
    },
    setCatalogViewMode(state, action: PayloadAction<CatalogViewMode>) {
      state.advancedFilters.viewMode = action.payload
    },
    setFreeDeliveryOnly(state, action: PayloadAction<boolean>) {
      state.advancedFilters.freeDeliveryOnly = action.payload
    },
    resetAdvancedFilters(state) {
      state.advancedFilters = {
        ...DEFAULT_ADVANCED_FILTERS,
        priceMin: state.catalogPriceBounds.min,
        priceMax: state.catalogPriceBounds.max,
      }
      state.categoryFilter = 'all'
    },
    hydrateCart(
      state,
      action: PayloadAction<{
        itemsById: CartState['itemsById']
        promoCode: string | null
        appliedCoupon?: CouponDefinition | null
      }>,
    ) {
      state.itemsById = action.payload.itemsById
      state.promoCode = action.payload.promoCode
      state.appliedCoupon = action.payload.appliedCoupon ?? null
      state.restoredFromStorage = true
      reconcileCartLines(state)
    },
    upsertProducts(state, action: PayloadAction<Product[]>) {
      mergeProducts(state, action.payload)
      expandPriceBounds(state, action.payload)
      reconcileCartLines(state)
    },
    setCatalogFromQuery(state, action: PayloadAction<ProductsResponse>) {
      applyCatalogResults(state, action.payload)
    },
    setCatalogLoading(state) {
      state.catalogStatus = 'loading'
      state.catalogError = null
    },
    setCatalogFailed(state, action: PayloadAction<string>) {
      state.catalogStatus = 'failed'
      state.catalogError = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadProductCatalog.pending, (state) => {
        state.catalogStatus = 'loading'
        state.catalogError = null
      })
      .addCase(loadProductCatalog.fulfilled, (state, action) => {
        applyCatalogResults(state, action.payload)
      })
      .addCase(loadProductCatalog.rejected, (state, action) => {
        if (action.error.name === 'AbortError') return
        state.catalogStatus = 'failed'
        state.catalogError = action.error.message ?? 'Failed to load catalog'
      })
  },
})

export const {
  addItem,
  removeItem,
  setQuantity,
  incrementQuantity,
  decrementQuantity,
  clearCart,
  applyPromoCode,
  clearPromoCode,
  setCategoryFilter,
  setPriceRange,
  setMinRating,
  setInStockOnly,
  setSortBy,
  setCatalogViewMode,
  setFreeDeliveryOnly,
  resetAdvancedFilters,
  hydrateCart,
  upsertProducts,
  setCatalogFromQuery,
  setCatalogLoading,
  setCatalogFailed,
} = cartSlice.actions

export default cartSlice.reducer
