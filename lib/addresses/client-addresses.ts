import { StorageKeys, getStorageJSON, setStorageJSON } from '@/lib/storage/client-storage'
import type { AddressFormValues } from '@/lib/validations/account'

export type SavedAddress = AddressFormValues & { id: string }

export function readUserAddresses(userId: string): SavedAddress[] {
  const parsed = getStorageJSON<SavedAddress[]>(StorageKeys.addresses(userId), [])
  return Array.isArray(parsed) ? parsed : []
}

export function writeUserAddresses(userId: string, addresses: SavedAddress[]) {
  setStorageJSON(StorageKeys.addresses(userId), addresses)
}

export function toAddressFormValues(address: SavedAddress | AddressFormValues): AddressFormValues {
  return {
    fullName: address.fullName,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2 ?? '',
    city: address.city,
    country: address.country,
  }
}
