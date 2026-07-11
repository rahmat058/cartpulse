import { cn } from '@/lib/utils'
import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { formTextareaClass } from '@/lib/utils/form-controls'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => <textarea ref={ref} className={cn(formTextareaClass, className)} {...props} />,
)
Textarea.displayName = 'Textarea'
