'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { zodResolver } from '@hookform/resolvers/zod'
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { AccountEmptyState } from '@/components/account/AccountEmptyState'
import { addressSchema, EMPTY_ADDRESS, type AddressFormValues } from '@/lib/validations/account'
import { readUserAddresses, writeUserAddresses, type SavedAddress } from '@/lib/addresses/client-addresses'

function readAddresses(userId: string): SavedAddress[] {
  return readUserAddresses(userId)
}

function writeAddresses(userId: string, addresses: SavedAddress[]) {
  writeUserAddresses(userId, addresses)
}

export function AddressesPanel() {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: EMPTY_ADDRESS,
  })

  useEffect(() => {
    if (!userId) return
    setAddresses(readAddresses(userId))
  }, [userId])

  const isEditing = useMemo(() => Boolean(editingId), [editingId])

  function openCreate() {
    setEditingId(null)
    reset(EMPTY_ADDRESS)
    setShowForm(true)
  }

  function openEdit(address: SavedAddress) {
    setEditingId(address.id)
    reset({
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 ?? '',
      city: address.city,
      country: address.country,
    })
    setShowForm(true)
  }

  function onSubmit(values: AddressFormValues) {
    if (!userId) {
      toast.error('Please sign in to save addresses')
      return
    }

    let next: SavedAddress[]
    if (editingId) {
      next = addresses.map((item) => (item.id === editingId ? { ...values, id: editingId } : item))
      toast.success('Address updated')
    } else {
      next = [...addresses, { ...values, id: crypto.randomUUID() }]
      toast.success('Address saved')
    }

    writeAddresses(userId, next)
    setAddresses(next)
    setShowForm(false)
    setEditingId(null)
    reset(EMPTY_ADDRESS)
  }

  function removeAddress(id: string) {
    if (!userId) return
    const next = addresses.filter((item) => item.id !== id)
    writeAddresses(userId, next)
    setAddresses(next)
    if (editingId === id) {
      setShowForm(false)
      setEditingId(null)
    }
    toast.success('Address removed')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Addresses</h2>
          <p className="mt-1 text-sm text-slate-500">Saved shipping and billing addresses</p>
        </div>
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add address
        </Button>
      </div>

      {showForm ? (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-3 rounded-md border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50"
          noValidate>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {isEditing ? 'Edit address' : 'New address'}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Full name</label>
              <Input {...register('fullName')} aria-invalid={Boolean(errors.fullName)} />
              {errors.fullName ? <p className="mt-1 text-xs text-rose-600">{errors.fullName.message}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Phone</label>
              <Input {...register('phone')} aria-invalid={Boolean(errors.phone)} />
              {errors.phone ? <p className="mt-1 text-xs text-rose-600">{errors.phone.message}</p> : null}
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-500">Address line 1</label>
              <Input {...register('line1')} aria-invalid={Boolean(errors.line1)} />
              {errors.line1 ? <p className="mt-1 text-xs text-rose-600">{errors.line1.message}</p> : null}
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-500">Address line 2 (optional)</label>
              <Input {...register('line2')} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">City</label>
              <Input {...register('city')} aria-invalid={Boolean(errors.city)} />
              {errors.city ? <p className="mt-1 text-xs text-rose-600">{errors.city.message}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Country</label>
              <Input {...register('country')} aria-invalid={Boolean(errors.country)} />
              {errors.country ? <p className="mt-1 text-xs text-rose-600">{errors.country.message}</p> : null}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="submit" loading={isSubmitting}>
              {isEditing ? 'Update' : 'Save'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false)
                setEditingId(null)
                reset(EMPTY_ADDRESS)
              }}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {addresses.length === 0 && !showForm ? (
        <AccountEmptyState
          title="No addresses saved"
          description="Add a delivery address here or at checkout for faster ordering next time."
          actionHref="/checkout"
          actionLabel="Go to checkout"
          icon={<MapPin className="h-9 w-9" strokeWidth={1.5} />}
        />
      ) : (
        <ul className="space-y-3">
          {addresses.map((address) => (
            <li
              key={address.id}
              className="rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{address.fullName}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{address.phone}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ''}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {address.city}, {address.country}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-teal-700 dark:hover:bg-slate-800"
                    onClick={() => openEdit(address)}
                    aria-label="Edit address">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded-md p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                    onClick={() => removeAddress(address.id)}
                    aria-label="Delete address">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
