import { Button, Heading, Hr, Img, Section, Text } from '@react-email/components'
import { EmailLayout, emailStyles } from '@/lib/emails/email-layout'

function getBaseUrl() {
  return process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function shortOrderId(orderId: string) {
  return orderId.slice(0, 8).toUpperCase()
}

export type PaymentSuccessEmailItem = {
  name: string
  variant?: string | null
  quantity: number
  unitPrice: number
  imageUrl?: string | null
  emoji?: string | null
}

export type PaymentSuccessEmailProps = {
  orderId: string
  customerName?: string
  placedAt: string
  paymentMethod: string
  items: PaymentSuccessEmailItem[]
  subtotal: number
  tax: number
  shipping: number
  discount: number
  total: number
  shippingAddress?: string | null
}

/** Stripe / card payment receipt — line items, totals, and delivery details. */
export function PaymentSuccessEmail(props: PaymentSuccessEmailProps) {
  const ordersUrl = `${getBaseUrl()}/dashboard/orders/${props.orderId}`
  const greeting = props.customerName?.trim() ? props.customerName.trim() : 'there'

  return (
    <EmailLayout
      preview={`Payment successful — ${formatMoney(props.total)} for order #${shortOrderId(props.orderId)}`}
      title="Payment successful"
      icon="check"
      footerNote="This email confirms your payment. Keep it for your records. Questions? Reply to this email or visit your order dashboard.">
      <Text style={emailStyles.successPill}>Payment confirmed</Text>
      <Heading style={emailStyles.h1}>Thanks, {greeting} — you&apos;re all set!</Heading>
      <Text style={emailStyles.text}>
        Your card payment was processed securely via Stripe. We&apos;re preparing your order and will notify you when it
        ships.
      </Text>

      <Section style={emailStyles.summaryBox}>
        <Text style={emailStyles.summaryLabel}>Order number</Text>
        <Text style={emailStyles.summaryValue}>#{shortOrderId(props.orderId)}</Text>
        <Text style={emailStyles.summaryLabel}>Placed on</Text>
        <Text style={emailStyles.summaryValue}>{props.placedAt}</Text>
        <Text style={emailStyles.summaryLabel}>Payment method</Text>
        <Text style={emailStyles.summaryValue}>{props.paymentMethod}</Text>
      </Section>

      <Text style={{ ...emailStyles.summaryLabel, marginBottom: '8px' }}>Order summary</Text>
      <table style={emailStyles.itemsTable} role="presentation" cellPadding={0} cellSpacing={0}>
        <tbody>
          {props.items.map((item, index) => (
            <tr key={`${item.name}-${index}`}>
              <td style={emailStyles.itemImageCell}>
                {item.imageUrl ? (
                  <Img src={item.imageUrl} alt={item.name} width={48} height={48} style={emailStyles.itemImage} />
                ) : (
                  <Text style={emailStyles.itemImagePlaceholder}>{item.emoji ?? '📦'}</Text>
                )}
              </td>
              <td style={emailStyles.itemCell}>
                <Text style={emailStyles.itemName}>{item.name}</Text>
                <Text style={emailStyles.itemMeta}>
                  Qty {item.quantity}
                  {item.variant ? ` · ${item.variant}` : ''}
                </Text>
              </td>
              <td style={{ ...emailStyles.itemCell, textAlign: 'right' as const, width: '88px' }}>
                <Text style={emailStyles.itemPrice}>{formatMoney(item.unitPrice * item.quantity)}</Text>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Hr style={{ borderColor: '#e2e8f0', margin: '8px 0 16px' }} />

      <Text style={emailStyles.totalsRow}>
        Subtotal <span style={{ float: 'right' }}>{formatMoney(props.subtotal)}</span>
      </Text>
      {props.tax > 0 ? (
        <Text style={emailStyles.totalsRow}>
          Tax <span style={{ float: 'right' }}>{formatMoney(props.tax)}</span>
        </Text>
      ) : null}
      {props.shipping > 0 ? (
        <Text style={emailStyles.totalsRow}>
          Shipping <span style={{ float: 'right' }}>{formatMoney(props.shipping)}</span>
        </Text>
      ) : null}
      {props.discount > 0 ? (
        <Text style={emailStyles.totalsRow}>
          Discount <span style={{ float: 'right', color: '#15803d' }}>-{formatMoney(props.discount)}</span>
        </Text>
      ) : null}
      <Text style={emailStyles.totalsRowStrong}>
        Total paid <span style={{ float: 'right', color: '#0f766e' }}>{formatMoney(props.total)}</span>
      </Text>

      {props.shippingAddress ? (
        <>
          <Text style={{ ...emailStyles.summaryLabel, margin: '20px 0 8px' }}>Delivery address</Text>
          <Section style={emailStyles.addressBox}>
            <Text style={emailStyles.addressText}>{props.shippingAddress}</Text>
          </Section>
        </>
      ) : null}

      <Section style={emailStyles.buttonSection}>
        <Button href={ordersUrl} style={emailStyles.button}>
          View order &amp; track delivery
        </Button>
      </Section>

      <Text style={emailStyles.muted}>Order reference: {props.orderId}</Text>
    </EmailLayout>
  )
}

export function OrderConfirmationEmail(props: { orderId: string; total: number; customerName?: string }) {
  const ordersUrl = `${getBaseUrl()}/dashboard/orders/${props.orderId}`
  const greeting = props.customerName?.trim() ? props.customerName.trim() : 'there'

  return (
    <EmailLayout
      preview={`Your CartPulse order #${shortOrderId(props.orderId)} is confirmed`}
      title="Order confirmed"
      icon="cart"
      footerNote="Questions about your order? Reply to this email or visit your dashboard for tracking updates.">
      <Text style={emailStyles.statusPill}>Order placed</Text>
      <Heading style={emailStyles.h1}>Thanks for your order, {greeting}!</Heading>
      <Text style={emailStyles.text}>
        We&apos;ve received your order and it&apos;s being prepared. You&apos;ll get another update when it ships.
      </Text>

      <Section style={emailStyles.summaryBox}>
        <Text style={emailStyles.summaryLabel}>Order number</Text>
        <Text style={emailStyles.summaryValue}>#{shortOrderId(props.orderId)}</Text>
        <Text style={emailStyles.summaryLabel}>Order total</Text>
        <Text style={emailStyles.summaryTotal}>{formatMoney(props.total)}</Text>
      </Section>

      <Text style={emailStyles.featureText}>✓ Secure checkout with Stripe &amp; COD</Text>
      <Text style={emailStyles.featureText}>✓ Track delivery from your dashboard</Text>
      <Text style={emailStyles.featureText}>✓ 7-day returns on eligible items</Text>

      <Section style={emailStyles.buttonSection}>
        <Button href={ordersUrl} style={emailStyles.button}>
          View order details
        </Button>
      </Section>

      <Text style={emailStyles.muted}>Order reference: {props.orderId}</Text>
    </EmailLayout>
  )
}

export function AdminOrderAlertEmail(props: { orderId: string; customerEmail: string; total: number }) {
  const adminUrl = `${getBaseUrl()}/admin/orders/${props.orderId}`

  return (
    <EmailLayout
      preview={`New paid order #${shortOrderId(props.orderId)} — ${formatMoney(props.total)}`}
      title="New order paid"
      icon="receipt"
      footerNote="CartPulse admin notification — manage orders from your admin panel.">
      <Heading style={emailStyles.h1}>A new order just came in</Heading>
      <Text style={emailStyles.text}>
        Order <strong>#{shortOrderId(props.orderId)}</strong> was paid and is ready for fulfillment.
      </Text>

      <Section style={emailStyles.summaryBox}>
        <Text style={emailStyles.summaryLabel}>Customer</Text>
        <Text style={emailStyles.summaryValue}>{props.customerEmail}</Text>
        <Text style={emailStyles.summaryLabel}>Order total</Text>
        <Text style={emailStyles.summaryTotal}>{formatMoney(props.total)}</Text>
      </Section>

      <Section style={emailStyles.buttonSection}>
        <Button href={adminUrl} style={emailStyles.button}>
          Open in admin
        </Button>
      </Section>

      <Text style={emailStyles.muted}>Order ID: {props.orderId}</Text>
    </EmailLayout>
  )
}
