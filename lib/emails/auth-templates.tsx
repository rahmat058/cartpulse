import { Button, Heading, Section, Text } from '@react-email/components'
import { EmailLayout, emailStyles } from '@/lib/emails/email-layout'

export function EmailVerificationEmail(props: { name?: string; verifyUrl: string }) {
  return (
    <EmailLayout
      preview="Verify your CartPulse email to start shopping"
      title="Verify your email"
      icon="mail"
      footerNote="If you didn't create a CartPulse account, you can safely ignore this email.">
      <Heading style={emailStyles.h1}>Almost there{props.name ? `, ${props.name}` : ''}!</Heading>
      <Text style={emailStyles.text}>
        Thanks for joining CartPulse. Confirm your email to unlock your dashboard, wishlist sync, and secure checkout.
      </Text>
      <Section style={emailStyles.buttonSection}>
        <Button href={props.verifyUrl} style={emailStyles.button}>
          Verify email address
        </Button>
      </Section>
      <Text style={emailStyles.muted}>
        This link expires in 24 hours. If the button doesn&apos;t work, copy this URL:
      </Text>
      <Text style={emailStyles.muted}>{props.verifyUrl}</Text>
    </EmailLayout>
  )
}

export function PasswordResetEmail(props: { resetUrl: string; name?: string }) {
  return (
    <EmailLayout
      preview="Reset your CartPulse password"
      title="Password reset"
      icon="key"
      footerNote="If you didn't request a password reset, ignore this email — your password won't change.">
      <Heading style={emailStyles.h1}>Reset your password</Heading>
      <Text style={emailStyles.text}>
        Hi{props.name ? ` ${props.name}` : ''}, we received a request to reset your CartPulse password. Click below to
        choose a new one.
      </Text>
      <Section style={emailStyles.buttonSection}>
        <Button href={props.resetUrl} style={emailStyles.button}>
          Reset password
        </Button>
      </Section>
      <Text style={emailStyles.text}>This link expires in 1 hour for your security.</Text>
      <Text style={emailStyles.muted}>{props.resetUrl}</Text>
    </EmailLayout>
  )
}

export function WelcomeEmail(props: { name?: string; dashboardUrl: string }) {
  return (
    <EmailLayout
      preview="Welcome to CartPulse — your account is ready"
      title="Welcome aboard"
      icon="sparkles"
      footerNote="Happy shopping from the CartPulse team.">
      <Heading style={emailStyles.h1}>You&apos;re verified{props.name ? `, ${props.name}` : ''}!</Heading>
      <Text style={emailStyles.text}>
        Your email is confirmed and your account is ready. Browse flash deals, save items to your wishlist, and track
        orders from your dashboard.
      </Text>
      <Text style={emailStyles.featureText}>✓ Secure checkout with Stripe &amp; COD</Text>
      <Text style={emailStyles.featureText}>✓ Wishlist synced across devices</Text>
      <Text style={emailStyles.featureText}>✓ Fast delivery on in-stock items</Text>
      <Section style={emailStyles.buttonSection}>
        <Button href={props.dashboardUrl} style={emailStyles.button}>
          Go to dashboard
        </Button>
      </Section>
    </EmailLayout>
  )
}

export function PasswordChangedEmail(props: { name?: string; loginUrl: string }) {
  return (
    <EmailLayout
      preview="Your CartPulse password was updated"
      title="Password updated"
      icon="shield"
      footerNote="Contact support if you didn't make this change.">
      <Heading style={emailStyles.h1}>Password changed successfully</Heading>
      <Text style={emailStyles.text}>
        Hi{props.name ? ` ${props.name}` : ''}, your CartPulse password was just updated. You can now sign in with your
        new password.
      </Text>
      <Section style={emailStyles.buttonSection}>
        <Button href={props.loginUrl} style={emailStyles.button}>
          Sign in
        </Button>
      </Section>
    </EmailLayout>
  )
}

export { EmailBrandIcon } from '@/lib/emails/email-layout'
