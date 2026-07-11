import { getEmailIconEmoji, type EmailIconKind } from '@/lib/emails/email-icons'
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components'

export const emailStyles = {
  main: {
    backgroundColor: '#f0fdfa',
    fontFamily: 'Roboto, Inter, Arial, sans-serif',
  },
  container: {
    backgroundColor: '#ffffff',
    margin: '40px auto',
    padding: '0',
    borderRadius: '16px',
    maxWidth: '520px',
    overflow: 'hidden' as const,
    border: '1px solid #ccfbf1',
  },
  header: {
    backgroundColor: '#0f766e',
    background: 'linear-gradient(135deg, #0f766e 0%, #0891b2 100%)',
    padding: '28px 32px',
    textAlign: 'center' as const,
  },
  brand: {
    color: '#99f6e4',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    margin: '0 0 8px',
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: '22px',
    fontWeight: 700,
    margin: '0',
  },
  iconWrap: {
    backgroundColor: '#1a8f84',
    borderRadius: '12px',
    width: '52px',
    height: '52px',
    textAlign: 'center' as const,
    verticalAlign: 'middle' as const,
  },
  iconEmoji: {
    fontSize: '26px',
    lineHeight: '52px',
    margin: '0',
    display: 'block' as const,
  },
  body: {
    padding: '32px',
  },
  h1: {
    color: '#0f172a',
    fontSize: '22px',
    fontWeight: 700,
    margin: '0 0 12px',
  },
  text: {
    color: '#475569',
    fontSize: '14px',
    lineHeight: '24px',
    margin: '0 0 16px',
  },
  muted: {
    color: '#94a3b8',
    fontSize: '12px',
    lineHeight: '20px',
    margin: '16px 0 0',
    wordBreak: 'break-all' as const,
  },
  buttonSection: {
    margin: '28px 0 8px',
    textAlign: 'center' as const,
  },
  button: {
    backgroundColor: '#0d9488',
    borderRadius: '10px',
    color: '#ffffff',
    display: 'inline-block',
    fontSize: '14px',
    fontWeight: 600,
    padding: '14px 28px',
    textDecoration: 'none',
  },
  footer: {
    backgroundColor: '#f8fafc',
    padding: '20px 32px',
    borderTop: '1px solid #e2e8f0',
  },
  footerText: {
    color: '#94a3b8',
    fontSize: '11px',
    lineHeight: '18px',
    margin: '0',
    textAlign: 'center' as const,
  },
  featureText: {
    color: '#64748b',
    fontSize: '13px',
    lineHeight: '20px',
    margin: '0 0 8px',
  },
  summaryBox: {
    backgroundColor: '#f0fdfa',
    border: '1px solid #99f6e4',
    borderRadius: '12px',
    padding: '16px 20px',
    margin: '0 0 20px',
  },
  summaryLabel: {
    color: '#64748b',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    margin: '0 0 4px',
  },
  summaryValue: {
    color: '#0f172a',
    fontSize: '15px',
    fontWeight: 600,
    margin: '0 0 12px',
  },
  summaryTotal: {
    color: '#0f766e',
    fontSize: '20px',
    fontWeight: 700,
    margin: '0',
  },
  statusPill: {
    backgroundColor: '#ccfbf1',
    borderRadius: '999px',
    color: '#0f766e',
    display: 'inline-block',
    fontSize: '12px',
    fontWeight: 600,
    margin: '0 0 16px',
    padding: '6px 12px',
  },
  successPill: {
    backgroundColor: '#dcfce7',
    borderRadius: '999px',
    color: '#15803d',
    display: 'inline-block',
    fontSize: '12px',
    fontWeight: 600,
    margin: '0 0 16px',
    padding: '6px 12px',
  },
  itemsTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    margin: '0 0 16px',
  },
  itemCell: {
    borderBottom: '1px solid #e2e8f0',
    color: '#334155',
    fontSize: '13px',
    lineHeight: '20px',
    padding: '12px 0',
    verticalAlign: 'middle' as const,
  },
  itemImageCell: {
    borderBottom: '1px solid #e2e8f0',
    padding: '12px 12px 12px 0',
    verticalAlign: 'middle' as const,
    width: '56px',
  },
  itemImage: {
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    display: 'block',
    height: '48px',
    objectFit: 'cover' as const,
    width: '48px',
  },
  itemImagePlaceholder: {
    backgroundColor: '#f0fdfa',
    border: '1px solid #ccfbf1',
    borderRadius: '8px',
    color: '#0f766e',
    display: 'block',
    fontSize: '22px',
    height: '48px',
    lineHeight: '48px',
    textAlign: 'center' as const,
    width: '48px',
  },
  itemName: {
    color: '#0f172a',
    fontSize: '14px',
    fontWeight: 600,
    margin: '0 0 2px',
  },
  itemMeta: {
    color: '#64748b',
    fontSize: '12px',
    margin: '0',
  },
  itemPrice: {
    color: '#0f172a',
    fontSize: '14px',
    fontWeight: 600,
    margin: '0',
    textAlign: 'right' as const,
  },
  totalsRow: {
    color: '#64748b',
    fontSize: '13px',
    margin: '0 0 6px',
  },
  totalsRowStrong: {
    color: '#0f172a',
    fontSize: '15px',
    fontWeight: 700,
    margin: '8px 0 0',
  },
  addressBox: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '14px 16px',
    margin: '0 0 20px',
  },
  addressText: {
    color: '#475569',
    fontSize: '13px',
    lineHeight: '22px',
    margin: '0',
    whiteSpace: 'pre-line' as const,
  },
}

function EmailHeaderIcon({ kind }: { kind: EmailIconKind }) {
  return (
    <table
      role="presentation"
      cellPadding={0}
      cellSpacing={0}
      border={0}
      align="center"
      style={{ margin: '0 auto 12px' }}>
      <tbody>
        <tr>
          <td style={emailStyles.iconWrap}>
            <Text style={emailStyles.iconEmoji} aria-label={kind}>
              {getEmailIconEmoji(kind)}
            </Text>
          </td>
        </tr>
      </tbody>
    </table>
  )
}

export function EmailLayout({
  preview,
  title,
  icon,
  children,
  footerNote,
}: {
  preview: string
  title: string
  icon?: EmailIconKind
  children: React.ReactNode
  footerNote?: string
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={emailStyles.main}>
        <Container style={emailStyles.container}>
          <Section style={emailStyles.header}>
            {icon ? <EmailHeaderIcon kind={icon} /> : null}
            <Text style={emailStyles.brand}>CartPulse</Text>
            <Heading style={emailStyles.brandTitle}>{title}</Heading>
          </Section>
          <Section style={emailStyles.body}>{children}</Section>
          <Section style={emailStyles.footer}>
            <Hr style={{ borderColor: '#e2e8f0', margin: '0 0 12px' }} />
            <Text style={emailStyles.footerText}>
              {footerNote ?? 'CartPulse — your marketplace for curated deals and fast delivery.'}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export function EmailBrandIcon() {
  return getEmailIconEmoji('bag')
}
