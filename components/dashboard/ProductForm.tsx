'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Plus, Trash2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import type { CreateProductInput, CreateProductVariantInput, ProductVariantType, UpdateProductInput } from '@/types/admin'
import type { StoreInfo } from '@/types/cart'
import { Button } from '@/components/ui/Button'
import { CategoryTreeSelect } from '@/components/ui/CategoryTreeSelect'
import { Checkbox } from '@/components/ui/Checkbox'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { useCategories } from '@/hooks/use-categories'
import { useDeleteConfirm } from '@/components/providers/DeleteConfirmProvider'
import { formSelectClass } from '@/lib/utils/form-controls'
import { sanitizeRichText } from '@/lib/utils/rich-text'
import { cn } from '@/lib/utils'
import {
  buildProductVariantsFromForm,
  computeProductStockFromFormValues,
  createProductFormSchema,
  DEFAULT_PRODUCT_FORM_VALUES,
  EMPTY_VARIANT,
  type ProductFormValues,
} from '@/lib/validations/product'

const PRODUCT_IMAGE_ACCEPT = '.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp'

function toPayload(values: ProductFormValues, isEdit: boolean): CreateProductInput {
  const variants = values.isDigital ? [] : buildProductVariantsFromForm(values.variants, values.variantType)
  const stock = values.isDigital ? 0 : computeProductStockFromFormValues(values)

  return {
    storeId: values.storeId ?? '',
    name: values.name.trim(),
    categorySlug: values.categorySlug,
    price: Number(values.price),
    stock,
    rating: values.rating ? Number(values.rating) : undefined,
    emoji: values.emoji,
    imageUrls: values.imageUrls,
    description: sanitizeRichText(values.description),
    published: values.published,
    isDigital: values.isDigital,
    digitalAssetUrl: values.isDigital ? values.digitalAssetUrl.trim() : null,
    variantType: values.variantType,
    variants: isEdit ? variants : variants.length > 0 ? variants : undefined,
  }
}

function Field({
  label,
  required,
  error,
  children,
  htmlFor,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
  htmlFor?: string
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-foreground text-sm font-medium">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </label>
      {children}
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </div>
  )
}

export function ProductForm({
  productId,
  variant = 'page',
  defaultStoreId,
  onSuccess,
  onClose,
}: {
  productId?: string
  variant?: 'page' | 'drawer'
  defaultStoreId?: string
  onSuccess?: () => void
  onClose?: () => void
}) {
  const router = useRouter()
  const isEdit = Boolean(productId)
  const isDrawer = variant === 'drawer'
  const schema = useMemo(() => createProductFormSchema(isEdit), [isEdit])

  const { data: categoryTree = [] } = useCategories()
  const categoryOptions = useMemo(() => {
    function buildOptions(
      nodes: typeof categoryTree,
      depth = 1,
    ): Array<{ value: string; name: string; emoji: string | null; depth: number }> {
      return nodes.flatMap((node) => [
        {
          value: node.slug,
          name: node.name,
          emoji: node.emoji,
          depth,
        },
        ...buildOptions(node.children, depth + 1),
      ])
    }

    return buildOptions(categoryTree)
  }, [categoryTree])

  const [stores, setStores] = useState<StoreInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { confirmDelete } = useDeleteConfirm()

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_PRODUCT_FORM_VALUES,
  })

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'variants',
  })

  const imageUrls = watch('imageUrls')
  const productName = watch('name')
  const variantRows = watch('variants')
  const variantType = watch('variantType')
  const stockValue = watch('stock')
  const isDigital = watch('isDigital')
  const hasVariants = fields.length > 0 && !isDigital
  const isColorVariant = variantType === 'COLOR'
  const variantStockKey = variantRows.map((row) => row.stock).join('|')

  useEffect(() => {
    if (!hasVariants) return
    const total = computeProductStockFromFormValues({
      stock: '0',
      variants: variantRows,
      variantType,
    })
    const nextStock = String(total)
    if (stockValue !== nextStock) {
      setValue('stock', nextStock, { shouldValidate: true, shouldDirty: true })
    }
  }, [hasVariants, setValue, stockValue, variantRows, variantStockKey, variantType])

  useEffect(() => {
    async function load() {
      try {
        const storesRes = await fetch('/api/stores')
        if (!storesRes.ok) throw new Error('Failed to load stores')
        const storesJson = (await storesRes.json()) as { data: StoreInfo[] }
        setStores(storesJson.data)

        if (productId) {
          const productRes = await fetch(`/api/admin/products/${productId}`)
          if (!productRes.ok) throw new Error('Failed to load product')
          const productJson = (await productRes.json()) as {
            data: {
              store: { id: string }
              name: string
              category: { slug: string }
              price: number
              stock: number
              rating: number
              emoji: string
              imageUrl?: string | null
              imageUrls?: string[]
              description: string
              published: boolean
              isDigital?: boolean
              digitalAssetUrl?: string | null
              variantType?: ProductVariantType
              variants?: CreateProductVariantInput[]
            }
          }
          const product = productJson.data
          const mappedVariants =
            product.variants?.map((item) => ({
              sku: item.sku,
              slug: item.slug,
              color: item.color,
              hex: item.hex,
              stock: String(item.stock),
              price: item.price != null ? String(item.price) : '',
              isDefault: Boolean(item.isDefault),
            })) ?? []
          const totalStock =
            mappedVariants.length > 0
              ? mappedVariants.reduce((sum, variant) => sum + Number(variant.stock), 0)
              : product.stock

          reset({
            storeId: product.store.id,
            name: product.name,
            categorySlug: product.category.slug,
            price: String(product.price),
            stock: String(totalStock),
            rating: String(product.rating),
            emoji: product.emoji,
            imageUrls:
              product.imageUrls && product.imageUrls.length > 0
                ? product.imageUrls
                : product.imageUrl
                  ? [product.imageUrl]
                  : [],
            description: product.description,
            published: product.published,
            isDigital: product.isDigital ?? false,
            digitalAssetUrl: product.digitalAssetUrl ?? '',
            variantType: product.variantType ?? 'COLOR',
            variants: mappedVariants,
          })
        } else {
          reset({
            ...DEFAULT_PRODUCT_FORM_VALUES,
            storeId: defaultStoreId || storesJson.data[0]?.id || '',
          })
        }
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [productId, defaultStoreId, reset])

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return

    setUploading(true)
    setSubmitError(null)
    try {
      const body = new FormData()
      Array.from(files).forEach((file) => body.append('files', file))

      const response = await fetch('/api/admin/upload', { method: 'POST', body })
      const json = (await response.json()) as {
        data?: Array<{ url: string }>
        error?: string
      }
      if (!response.ok) throw new Error(json.error ?? 'Upload failed')

      const uploaded = json.data?.map((item) => item.url) ?? []
      if (uploaded.length === 0) throw new Error('Upload failed')

      setValue('imageUrls', [...(imageUrls ?? []), ...uploaded], {
        shouldDirty: true,
        shouldValidate: true,
      })
      toast.success(uploaded.length === 1 ? 'Image uploaded' : `${uploaded.length} images uploaded`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      setSubmitError(message)
      toast.error(message)
    } finally {
      setUploading(false)
    }
  }

  async function handleRemoveImage(url: string) {
    const nextUrls = (imageUrls ?? []).filter((item) => item !== url)
    setValue('imageUrls', nextUrls, { shouldDirty: true, shouldValidate: true })

    if (!isEdit) {
      try {
        await fetch('/api/admin/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        })
      } catch {
        toast.error('Failed to remove image from Cloudinary')
      }
    }
  }

  async function onSubmit(values: ProductFormValues) {
    setSubmitError(null)

    try {
      const payload = toPayload(values, isEdit)
      const response = await fetch(isEdit ? `/api/admin/products/${productId}` : '/api/admin/products', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEdit
            ? ({
                name: payload.name,
                categorySlug: payload.categorySlug,
                price: payload.price,
                stock: payload.stock,
                rating: payload.rating,
                emoji: payload.emoji,
                imageUrls: payload.imageUrls ?? [],
                description: payload.description,
                published: payload.published,
                isDigital: payload.isDigital,
                digitalAssetUrl: payload.digitalAssetUrl,
                variantType: payload.variantType,
                variants: payload.variants ?? [],
              } satisfies UpdateProductInput)
            : payload,
        ),
      })

      const body = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(body.error ?? 'Failed to save product')

      toast.success(isEdit ? 'Product updated' : 'Product created')
      if (isDrawer) {
        onSuccess?.()
      } else {
        router.push('/admin/products')
        router.refresh()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save product'
      setSubmitError(message)
      toast.error(message)
    }
  }

  async function handleDelete() {
    if (!productId) return
    const confirmed = await confirmDelete({
      entityName: productName?.trim() || 'this product',
      description: 'It will be removed from the storefront but kept for order history.',
    })
    if (!confirmed) return

    setDeleting(true)
    setSubmitError(null)
    try {
      const response = await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' })
      const body = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(body.error ?? 'Failed to delete product')

      toast.success('Product deleted')
      if (isDrawer) {
        onSuccess?.()
      } else {
        router.push('/admin/products')
        router.refresh()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete product'
      setSubmitError(message)
      toast.error(message)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <p className={isDrawer ? 'text-muted-foreground px-5 py-8 text-sm' : 'text-muted-foreground p-8 text-sm'}>
        Loading…
      </p>
    )
  }

  const formContent = (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={
        isDrawer
          ? 'flex h-full min-h-0 flex-1 flex-col overflow-hidden'
          : 'border-border bg-card mt-8 max-w-2xl space-y-5 rounded-md border p-6'
      }>
      <div className={isDrawer ? 'min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-4' : 'space-y-5'}>
        {!isEdit ? (
          <Field label="Store" required error={errors.storeId?.message} htmlFor="storeId">
            <select id="storeId" {...register('storeId')} className={formSelectClass}>
              <option value="" disabled>
                Select a store
              </option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.logoEmoji} {store.name}
                </option>
              ))}
            </select>
          </Field>
        ) : null}

        <Field label="Product name" required error={errors.name?.message} htmlFor="name">
          <Input id="name" {...register('name')} aria-invalid={Boolean(errors.name)} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" required error={errors.categorySlug?.message} htmlFor="categorySlug">
            <Controller
              name="categorySlug"
              control={control}
              render={({ field }) => (
                <CategoryTreeSelect
                  id="categorySlug"
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                  options={categoryOptions}
                  placeholder="Select category"
                  aria-invalid={Boolean(errors.categorySlug)}
                />
              )}
            />
          </Field>

          <Field label="Emoji" required error={errors.emoji?.message} htmlFor="emoji">
            <Input id="emoji" {...register('emoji')} aria-invalid={Boolean(errors.emoji)} />
          </Field>
        </div>

        <Field label="Product images" error={errors.imageUrls?.message}>
          <div className="space-y-3">
            <label className="border-input text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm transition-colors hover:border-teal-500">
              <Upload className="h-4 w-4" />
              {uploading ? 'Uploading…' : 'Upload images (PNG, JPEG, JPG, WebP)'}
              <input
                type="file"
                accept={PRODUCT_IMAGE_ACCEPT}
                multiple
                className="hidden"
                disabled={uploading}
                onChange={(event) => {
                  void handleUpload(event.target.files)
                  event.target.value = ''
                }}
              />
            </label>

            {imageUrls && imageUrls.length > 0 ? (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {imageUrls.map((url) => (
                  <div
                    key={url}
                    className="group border-border bg-muted/30 relative overflow-hidden rounded-md border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="aspect-square w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => void handleRemoveImage(url)}
                      className="absolute top-1.5 right-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                      aria-label="Remove image">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">
                Upload one or more product images. The first image is used as the cover.
              </p>
            )}
          </div>
        </Field>

        <div className={cn('grid gap-4', isEdit ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
          <Field label="Price" required error={errors.price?.message} htmlFor="price">
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              {...register('price')}
              aria-invalid={Boolean(errors.price)}
            />
          </Field>
          {!isDigital ? (
            <Field
              label={hasVariants ? 'Total stock' : 'Stock'}
              required
              error={errors.stock?.message}
              htmlFor="stock"
            >
              <Input
                id="stock"
                type="number"
                min="0"
                disabled={hasVariants}
                {...register('stock')}
                aria-invalid={Boolean(errors.stock)}
                className={hasVariants ? 'bg-muted/60 cursor-not-allowed' : undefined}
              />
              {hasVariants ? (
                <p className="text-muted-foreground text-xs">
                  Calculated from variant stock. Edit stock in each variant row below.
                </p>
              ) : null}
            </Field>
          ) : null}
          {isEdit ? (
            <Field label="Rating" required error={errors.rating?.message} htmlFor="rating">
              <Input
                id="rating"
                type="number"
                min="0"
                max="5"
                step="0.1"
                {...register('rating')}
                aria-invalid={Boolean(errors.rating)}
              />
            </Field>
          ) : null}
        </div>

        <Field label="Description" required error={errors.description?.message} htmlFor="description">
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                id="description"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                aria-invalid={Boolean(errors.description)}
                placeholder="Describe your product — features, materials, sizing, etc."
              />
            )}
          />
        </Field>

        {!isDigital ? (
        <div className="border-border space-y-3 rounded-md border p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-foreground text-sm font-semibold">Variants</h3>
            <div className="flex flex-wrap items-center gap-2">
              <Controller
                name="variantType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9 w-[132px]">
                      <SelectValue placeholder="Variant type">
                        {field.value === 'SIZE' ? 'Size' : 'Color'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COLOR">Color</SelectItem>
                      <SelectItem value="SIZE">Size</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <Button type="button" size="sm" variant="outline" onClick={() => append(EMPTY_VARIANT)}>
                <Plus className="h-3.5 w-3.5" />
                Add variant
              </Button>
            </div>
          </div>
          {fields.length === 0 ? (
            <p className="text-muted-foreground text-xs">
              Optional {isColorVariant ? 'color' : 'size'} variants with per-variant stock.
            </p>
          ) : (
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className={cn(
                    'bg-muted/40 grid gap-2 rounded-md p-3',
                    isColorVariant ? 'sm:grid-cols-6' : 'sm:grid-cols-5',
                  )}>
                  <div className="space-y-1">
                    <Input
                      placeholder="SKU"
                      {...register(`variants.${index}.sku`)}
                      className="h-9 text-xs"
                      aria-invalid={Boolean(errors.variants?.[index]?.sku)}
                    />
                    {errors.variants?.[index]?.sku ? (
                      <p className="text-destructive text-[10px]">{errors.variants[index]?.sku?.message}</p>
                    ) : null}
                  </div>
                  <Input
                    placeholder={isColorVariant ? 'Color name' : 'Size name'}
                    {...register(`variants.${index}.color`)}
                    className="h-9 text-xs"
                  />
                  {isColorVariant ? (
                    <Controller
                      name={`variants.${index}.hex`}
                      control={control}
                      render={({ field: hexField }) => (
                        <input
                          type="color"
                          value={hexField.value}
                          onChange={hexField.onChange}
                          className="border-input bg-background h-9 w-full rounded-md border"
                        />
                      )}
                    />
                  ) : null}
                  <Input
                    type="number"
                    min="0"
                    placeholder="Stock"
                    {...register(`variants.${index}.stock`)}
                    className="h-9 text-xs"
                  />
                  <label className="text-muted-foreground flex items-center gap-2 text-xs">
                    <Controller
                      name={`variants.${index}.isDefault`}
                      control={control}
                      render={({ field: defaultField }) => (
                        <Checkbox
                          checked={defaultField.value}
                          onCheckedChange={(checked) => {
                            fields.forEach((_, variantIndex) => {
                              update(variantIndex, {
                                ...watch(`variants.${variantIndex}`),
                                isDefault: variantIndex === index && checked === true,
                              })
                            })
                          }}
                          aria-label="Default variant"
                        />
                      )}
                    />
                    Default
                  </label>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-destructive inline-flex items-center justify-center"
                    aria-label="Remove variant">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        ) : null}

        <div className="border-border bg-muted/30 flex items-center justify-between rounded-md border px-4 py-3">
          <div>
            <p className="text-foreground text-sm font-medium">Digital product</p>
            <p className="text-muted-foreground text-xs">Instant delivery — no shipping or stock tracking</p>
          </div>
          <Controller
            name="isDigital"
            control={control}
            render={({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked)
                  if (checked) {
                    setValue('stock', '0', { shouldValidate: true })
                  }
                }}
                aria-label="Digital product"
              />
            )}
          />
        </div>

        {isDigital ? (
          <Field label="Download URL" required error={errors.digitalAssetUrl?.message} htmlFor="digitalAssetUrl">
            <Input
              id="digitalAssetUrl"
              {...register('digitalAssetUrl')}
              placeholder="https://example.com/files/your-product.pdf"
              aria-invalid={Boolean(errors.digitalAssetUrl)}
            />
          </Field>
        ) : null}

        <div className="border-border bg-muted/30 flex items-center justify-between rounded-md border px-4 py-3">
          <div>
            <p className="text-foreground text-sm font-medium">Published</p>
            <p className="text-muted-foreground text-xs">Show this product on the storefront</p>
          </div>
          <Controller
            name="published"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Published" />
            )}
          />
        </div>

        {submitError ? <p className="text-destructive text-sm">{submitError}</p> : null}
      </div>

      <div
        className={
          isDrawer ? 'border-border bg-card flex shrink-0 flex-wrap items-center gap-2 border-t p-5' : 'space-y-3'
        }>
        {isDrawer ? (
          <>
            <Button type="submit" disabled={isSubmitting || deleting} loading={isSubmitting}>
              {isEdit ? 'Save changes' : 'Create product'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/50"
              onClick={onClose}
              disabled={isSubmitting || deleting}>
              Cancel
            </Button>
            {isEdit ? (
              <Button
                type="button"
                variant="destructive"
                className="ml-auto"
                disabled={isSubmitting || deleting}
                loading={deleting}
                onClick={() => void handleDelete()}>
                <Trash2 />
                Delete
              </Button>
            ) : null}
          </>
        ) : (
          <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
            {isEdit ? 'Save changes' : 'Create product under store'}
          </Button>
        )}
      </div>
    </form>
  )

  if (isDrawer) {
    return formContent
  }

  return (
    <main className="p-8">
      <Link
        href="/admin/products"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-700">
        <ArrowLeft className="h-4 w-4" />
        Back to products
      </Link>

      <h1 className="text-foreground text-2xl font-bold">{isEdit ? 'Edit Product' : 'Add Product'}</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        {isEdit
          ? 'Update product details, image, publish state, and variants.'
          : 'Products are always created under a store. Pick the store first.'}
      </p>

      {formContent}
    </main>
  )
}
