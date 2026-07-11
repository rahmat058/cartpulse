import { Document, Font, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import {
  FULFILLMENT_STEPS,
  formatFulfillmentStepLabel,
  formatOrderMoney,
  formatOrderPlacedAt,
  formatPaymentMethod,
  formatShippingAddress,
  fulfillmentStepIndex,
  type OrderDisplayData,
} from '@/lib/orders/order-display'

Font.registerHyphenationCallback((word) => [word])

const colors = {
  teal: '#0d9488',
  tealDark: '#0f766e',
  text: '#111827',
  muted: '#6b7280',
  border: '#e5e7eb',
  card: '#f9fafb',
  warning: '#c2410c',
  warningBg: '#fff7ed',
  success: '#15803d',
  successBg: '#f0fdf4',
  danger: '#b91c1c',
  dangerBg: '#fef2f2',
}

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: colors.text,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brand: {
    fontSize: 11,
    fontWeight: 700,
    color: colors.teal,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 6,
  },
  meta: {
    fontSize: 9,
    color: colors.muted,
    marginBottom: 4,
  },
  orderId: {
    fontSize: 8,
    color: colors.muted,
    fontFamily: 'Courier',
  },
  totalBlock: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 8,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: 700,
    color: colors.tealDark,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 8,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  section: {
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    backgroundColor: colors.card,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 8,
    color: colors.tealDark,
  },
  stepperWrap: {
    padding: 10,
    borderRadius: 6,
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#99f6e4',
  },
  stepperTrack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepColumn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: '#d1d5db',
  },
  stepConnectorComplete: {
    backgroundColor: colors.teal,
  },
  stepConnectorSpacer: {
    flex: 1,
  },
  stepLabelsRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  stepLabelColumn: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  stepLabel: {
    fontSize: 8,
    fontWeight: 600,
    textAlign: 'center',
    color: colors.muted,
  },
  stepLabelComplete: {
    color: colors.tealDark,
  },
  stepLabelCurrent: {
    color: colors.tealDark,
    fontWeight: 700,
  },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  stepCircleComplete: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  stepCircleCurrent: {
    backgroundColor: '#ccfbf1',
    borderColor: colors.teal,
  },
  stepCircleUpcoming: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
  },
  stepNumber: {
    fontSize: 10,
    fontWeight: 700,
    color: '#ffffff',
  },
  stepNumberCurrent: {
    fontSize: 9,
    fontWeight: 700,
    color: colors.tealDark,
  },
  stepNumberUpcoming: {
    fontSize: 9,
    fontWeight: 700,
    color: colors.muted,
  },
  stepCheck: {
    fontSize: 10,
    fontWeight: 700,
    color: '#ffffff',
  },
  cancelledBox: {
    padding: 12,
    borderRadius: 6,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  cancelledTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: colors.danger,
    marginBottom: 3,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemImage: {
    width: 44,
    height: 44,
    borderRadius: 4,
    marginRight: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: 44,
    height: 44,
    borderRadius: 4,
    objectFit: 'cover',
  },
  emoji: {
    fontSize: 18,
  },
  itemBody: {
    flex: 1,
    paddingRight: 12,
  },
  itemName: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 3,
  },
  itemMeta: {
    fontSize: 9,
    color: colors.muted,
  },
  itemTotal: {
    fontSize: 10,
    fontWeight: 700,
  },
  sidebarGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  sidebarCol: {
    flex: 1,
  },
  bodyText: {
    fontSize: 9,
    color: colors.muted,
    lineHeight: 1.5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 9,
    color: colors.muted,
  },
  summaryValue: {
    fontSize: 9,
    fontWeight: 600,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryTotalLabel: {
    fontSize: 11,
    fontWeight: 700,
  },
  summaryTotalValue: {
    fontSize: 11,
    fontWeight: 700,
    color: colors.tealDark,
  },
  noteBox: {
    marginTop: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  noteLabel: {
    fontSize: 7,
    fontWeight: 700,
    color: colors.muted,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    textAlign: 'center',
    fontSize: 8,
    color: colors.muted,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
})

function statusStyle(status: string) {
  switch (status) {
    case 'PENDING':
      return { backgroundColor: colors.warningBg, color: colors.warning }
    case 'PAID':
    case 'SHIPPED':
      return { backgroundColor: '#ccfbf1', color: colors.tealDark }
    case 'DELIVERED':
      return { backgroundColor: colors.successBg, color: colors.success }
    case 'CANCELLED':
      return { backgroundColor: colors.dangerBg, color: colors.danger }
    default:
      return { backgroundColor: '#f3f4f6', color: colors.muted }
  }
}

function FulfillmentStepper({ status }: { status: string }) {
  const currentIndex = fulfillmentStepIndex(status)
  const lastIndex = FULFILLMENT_STEPS.length - 1

  if (status === 'CANCELLED') {
    return (
      <View style={styles.cancelledBox}>
        <Text style={styles.cancelledTitle}>This order was cancelled.</Text>
        <Text style={styles.bodyText}>Fulfillment progress is no longer active.</Text>
      </View>
    )
  }

  return (
    <View style={styles.stepperWrap}>
      <View style={styles.stepperTrack}>
        {FULFILLMENT_STEPS.map((step, index) => {
          const isComplete = index < currentIndex
          const isCurrent = index === currentIndex
          const leftConnectorComplete = index > 0 && index <= currentIndex
          const rightConnectorComplete = index < lastIndex && index < currentIndex

          return (
            <View key={step} style={styles.stepColumn}>
              {index > 0 ? (
                <View
                  style={
                    leftConnectorComplete ? [styles.stepConnector, styles.stepConnectorComplete] : styles.stepConnector
                  }
                />
              ) : (
                <View style={styles.stepConnectorSpacer} />
              )}

              <View
                style={[
                  styles.stepCircle,
                  isComplete
                    ? styles.stepCircleComplete
                    : isCurrent
                      ? styles.stepCircleCurrent
                      : styles.stepCircleUpcoming,
                ]}>
                {isComplete ? (
                  <Text style={styles.stepCheck}>✓</Text>
                ) : (
                  <Text style={isCurrent ? styles.stepNumberCurrent : styles.stepNumberUpcoming}>{index + 1}</Text>
                )}
              </View>

              {index < lastIndex ? (
                <View
                  style={
                    rightConnectorComplete ? [styles.stepConnector, styles.stepConnectorComplete] : styles.stepConnector
                  }
                />
              ) : (
                <View style={styles.stepConnectorSpacer} />
              )}
            </View>
          )
        })}
      </View>

      <View style={styles.stepLabelsRow}>
        {FULFILLMENT_STEPS.map((step, index) => {
          const isComplete = index < currentIndex
          const isCurrent = index === currentIndex

          return (
            <View key={`${step}-label`} style={styles.stepLabelColumn}>
              <Text
                style={[
                  styles.stepLabel,
                  isComplete ? styles.stepLabelComplete : isCurrent ? styles.stepLabelCurrent : styles.stepLabel,
                ]}>
                {formatFulfillmentStepLabel(step)}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

function SummaryRow({ label, value, total }: { label: string; value: string; total?: boolean }) {
  if (total) {
    return (
      <View style={styles.summaryTotalRow}>
        <Text style={styles.summaryTotalLabel}>{label}</Text>
        <Text style={styles.summaryTotalValue}>{value}</Text>
      </View>
    )
  }

  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  )
}

export function OrderDetailPdfDocument({ order }: { order: OrderDisplayData }) {
  const shippingAddress = formatShippingAddress(order)
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)
  const badge = statusStyle(order.status)

  return (
    <Document title={`Order ${order.id}`} author="CartPulse">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>CartPulse</Text>
            <Text style={styles.title}>Order details</Text>
            <Text style={styles.meta}>
              Placed {formatOrderPlacedAt(order.createdAt)} · {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Text>
            <Text style={styles.orderId}>{order.id}</Text>
            <View style={[styles.statusBadge, { backgroundColor: badge.backgroundColor }]}>
              <Text style={[styles.statusText, { color: badge.color }]}>{order.status}</Text>
            </View>
          </View>

          <View style={styles.totalBlock}>
            <Text style={styles.totalLabel}>Order total</Text>
            <Text style={styles.totalValue}>{formatOrderMoney(order.total)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery progress</Text>
          <FulfillmentStepper status={order.status} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items in this order</Text>
          {order.items.map((item, index) => {
            const lineTotal = item.unitPrice * item.quantity
            const imageUrl = item.product.imageUrl ?? item.product.imageUrls?.[0]
            const isLast = index === order.items.length - 1

            return (
              <View
                key={item.id}
                style={isLast ? [styles.itemRow, { borderBottomWidth: 0, paddingBottom: 0 }] : styles.itemRow}>
                <View style={styles.itemImage}>
                  {imageUrl ? (
                    <Image src={imageUrl} style={styles.productImage} />
                  ) : (
                    <Text style={styles.emoji}>{item.product.emoji}</Text>
                  )}
                </View>

                <View style={styles.itemBody}>
                  <Text style={styles.itemName}>{item.product.name}</Text>
                  <Text style={styles.itemMeta}>
                    {item.variant ? `${item.variant.color} · ` : ''}
                    Qty {item.quantity} · {formatOrderMoney(item.unitPrice)} each
                  </Text>
                </View>

                <Text style={styles.itemTotal}>{formatOrderMoney(lineTotal)}</Text>
              </View>
            )
          })}
        </View>

        <View style={styles.sidebarGrid}>
          <View style={[styles.section, styles.sidebarCol]}>
            <Text style={styles.sectionTitle}>Shipping address</Text>
            {shippingAddress ? (
              <Text style={styles.bodyText}>{shippingAddress}</Text>
            ) : (
              <Text style={styles.bodyText}>No shipping address on file.</Text>
            )}
            {order.deliveryNote ? (
              <View style={styles.noteBox}>
                <Text style={styles.noteLabel}>Delivery note</Text>
                <Text style={styles.bodyText}>{order.deliveryNote}</Text>
              </View>
            ) : null}
          </View>

          <View style={[styles.section, styles.sidebarCol]}>
            <Text style={styles.sectionTitle}>Payment</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Method</Text>
              <Text style={styles.summaryValue}>{formatPaymentMethod(order.paymentMethod)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Status</Text>
              <Text style={styles.summaryValue}>{order.status}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order summary</Text>
          <SummaryRow label="Subtotal" value={formatOrderMoney(order.subtotal)} />
          {order.discount > 0 ? <SummaryRow label="Discount" value={`−${formatOrderMoney(order.discount)}`} /> : null}
          <SummaryRow label="Tax" value={formatOrderMoney(order.tax)} />
          <SummaryRow label="Shipping" value={order.shipping === 0 ? 'Free' : formatOrderMoney(order.shipping)} />
          <SummaryRow label="Total" value={formatOrderMoney(order.total)} total />
        </View>

        <Text style={styles.footer}>Generated by CartPulse · {formatOrderPlacedAt(new Date())}</Text>
      </Page>
    </Document>
  )
}
