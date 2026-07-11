import { Resend } from 'resend'
import { render } from '@react-email/render'
import { getAuthBaseUrl } from '@/lib/auth-tokens'
import {
  EmailVerificationEmail,
  PasswordChangedEmail,
  PasswordResetEmail,
  WelcomeEmail,
} from '@/lib/emails/auth-templates'

function getResend() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  return new Resend(apiKey)
}

const from = process.env.EMAIL_FROM ?? 'CartPulse <onboarding@resend.dev>'

export async function sendEmailVerificationEmail(input: { to: string; name?: string; verifyUrl: string }) {
  const resend = getResend()
  if (!resend) {
    console.info('[email stub] Verify email →', input.to, input.verifyUrl)
    return { ok: true, stub: true }
  }

  const html = await render(EmailVerificationEmail({ name: input.name, verifyUrl: input.verifyUrl }))

  await resend.emails.send({
    from,
    to: input.to,
    subject: 'Verify your CartPulse email',
    html,
  })

  return { ok: true }
}

export async function sendPasswordResetEmail(input: { to: string; resetUrl: string; name?: string }) {
  const resend = getResend()
  if (!resend) {
    console.info('[email stub] Password reset →', input.to, input.resetUrl)
    return { ok: true, stub: true }
  }

  const html = await render(PasswordResetEmail({ resetUrl: input.resetUrl, name: input.name }))

  await resend.emails.send({
    from,
    to: input.to,
    subject: 'Reset your CartPulse password',
    html,
  })

  return { ok: true }
}

export async function sendWelcomeEmail(input: { to: string; name?: string }) {
  const resend = getResend()
  const dashboardUrl = `${getAuthBaseUrl()}/dashboard`
  if (!resend) {
    console.info('[email stub] Welcome →', input.to, dashboardUrl)
    return { ok: true, stub: true }
  }

  const html = await render(WelcomeEmail({ name: input.name, dashboardUrl }))

  await resend.emails.send({
    from,
    to: input.to,
    subject: "Welcome to CartPulse — you're all set!",
    html,
  })

  return { ok: true }
}

export async function sendPasswordChangedEmail(input: { to: string; name?: string }) {
  const resend = getResend()
  const loginUrl = `${getAuthBaseUrl()}/login`
  if (!resend) {
    console.info('[email stub] Password changed →', input.to)
    return { ok: true, stub: true }
  }

  const html = await render(PasswordChangedEmail({ name: input.name, loginUrl }))

  await resend.emails.send({
    from,
    to: input.to,
    subject: 'Your CartPulse password was updated',
    html,
  })

  return { ok: true }
}
