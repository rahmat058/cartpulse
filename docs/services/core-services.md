# Core Services — Soft Delete

Modules: `soft-delete.ts`, `SoftDeleteService.ts`

---

## Purpose

CartPulse uses **soft deletes** (`deletedAt` timestamp) instead of hard deletes for users, products, stores, categories, and coupons. This preserves order history and audit integrity.

`NOT_DELETED` is a shared Prisma filter used in virtually every read query.

---

## `soft-delete.ts` — facade

### Key exports

| Export                                    | Description                                         |
| ----------------------------------------- | --------------------------------------------------- |
| `NOT_DELETED`                             | `{ deletedAt: null }` — spread into `where` clauses |
| `softDeleteProductById(id)`               | Soft delete product                                 |
| `softDeleteStoreById(id)`                 | Soft delete store + cascade products                |
| `softDeleteCategoryById(id)`              | Soft delete category + children                     |
| `softDeleteCouponById(id)`                | Soft delete coupon                                  |
| `softDeleteUserById(id)`                  | Soft delete user                                    |
| `releaseUniqueValue(table, field, value)` | Free slug/email for reuse after delete              |

### Code demo — filter reads

```typescript
// Any service query
import { NOT_DELETED } from '@/lib/services/soft-delete'

const products = await prisma.product.findMany({
  where: { published: true, ...NOT_DELETED },
})
```

### Code demo — auth excludes deleted users

```typescript
// lib/auth.ts (credentials provider)
const user = await prisma.user.findFirst({
  where: { email, ...NOT_DELETED },
})
```

### Code demo — admin delete product

```typescript
// app/api/admin/products/[id]/route.ts
import { softDeleteProductById } from '@/lib/services/soft-delete'

export async function DELETE(_req, { params }) {
  await softDeleteProductById(params.id)
  await logAdminActivity({
    action: 'DELETE',
    entityType: 'PRODUCT',
    entityId: params.id,
    summary: 'Deleted product',
  })
  return NextResponse.json({ ok: true })
}
```

---

## `SoftDeleteService.ts` — implementation

**Purpose:** Transactional soft-delete with slug/email release and cascade rules.

### Class methods

| Method                   | Cascade behavior                  |
| ------------------------ | --------------------------------- |
| `softDeleteProductById`  | Sets `deletedAt`, releases `slug` |
| `softDeleteStoreById`    | Store + all its products          |
| `softDeleteCategoryById` | Category + descendants            |
| `softDeleteCouponById`   | Coupon only                       |
| `softDeleteUserById`     | User only (orders preserved)      |

### Code demo — internal cascade

```typescript
// lib/services/SoftDeleteService.ts (simplified)
async softDeleteStoreById(storeId: string) {
  return this.db.$transaction(async (tx) => {
    const products = await tx.product.findMany({ where: { storeId, ...NOT_DELETED } })
    for (const product of products) {
      await this.softDeleteProductRecord(tx, product)
    }
    await tx.store.update({
      where: { id: storeId },
      data: { deletedAt: new Date() },
    })
  })
}
```

---

## When to use

| Action                        | Use                                                  |
| ----------------------------- | ---------------------------------------------------- |
| Hide product from catalog     | `setProductPublished(false)` — reversible            |
| Permanently remove from admin | `softDeleteProductById()`                            |
| Query any entity              | Always spread `NOT_DELETED`                          |
| Re-use slug after delete      | `releaseUniqueValue` runs inside soft-delete helpers |

Hard deletes are not exposed in the admin UI.
