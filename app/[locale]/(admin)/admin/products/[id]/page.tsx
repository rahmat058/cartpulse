import { ProductForm } from '@/components/dashboard/ProductForm'

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ProductForm productId={id} />
}
