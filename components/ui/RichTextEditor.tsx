'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import {
  Bold,
  ChevronDown,
  Eraser,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
  Underline as UnderlineIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formSelectClass } from '@/lib/utils/form-controls'
import { normalizeRichTextHtml } from '@/lib/utils/rich-text'

const IMAGE_ACCEPT = '.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp'

const HEADING_OPTIONS = [
  { value: 'p', label: 'Normal' },
  { value: '1', label: 'Heading 1' },
  { value: '2', label: 'Heading 2' },
  { value: '3', label: 'Heading 3' },
  { value: '4', label: 'Heading 4' },
  { value: '5', label: 'Heading 5' },
  { value: '6', label: 'Heading 6' },
] as const

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

function getActiveHeadingValue(editor: Editor): string {
  if (editor.isActive('paragraph')) return 'p'
  for (const level of [1, 2, 3, 4, 5, 6] as const) {
    if (editor.isActive('heading', { level })) return String(level)
  }
  return 'p'
}

function HeadingDropdown({ editor }: { editor: Editor }) {
  const [, setRevision] = useState(0)

  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1)
    editor.on('selectionUpdate', refresh)
    editor.on('transaction', refresh)
    return () => {
      editor.off('selectionUpdate', refresh)
      editor.off('transaction', refresh)
    }
  }, [editor])

  const activeValue = getActiveHeadingValue(editor)
  const activeLabel = HEADING_OPTIONS.find((option) => option.value === activeValue)?.label ?? 'Normal'

  return (
    <div className="relative">
      <select
        aria-label="Text style"
        value={activeValue}
        onChange={(event) => {
          const value = event.target.value
          if (value === 'p') {
            editor.chain().focus().setParagraph().run()
            return
          }
          editor
            .chain()
            .focus()
            .toggleHeading({ level: Number(value) as HeadingLevel })
            .run()
        }}
        className={cn(formSelectClass, 'h-8 min-w-[9.5rem] appearance-none pr-8 text-xs font-medium')}>
        {HEADING_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 h-3.5 w-3.5 -translate-y-1/2"
        aria-hidden
      />
      <span className="sr-only">Current style: {activeLabel}</span>
    </div>
  )
}

export type RichTextEditorProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  disabled?: boolean
  className?: string
  minHeight?: number
  'aria-invalid'?: boolean
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors',
        'text-muted-foreground hover:bg-background hover:text-foreground',
        'disabled:pointer-events-none disabled:opacity-40',
        active && 'bg-teal-100 text-teal-700 shadow-sm dark:bg-teal-950/50 dark:text-teal-300',
      )}>
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <span className="bg-border mx-1 h-6 w-px" aria-hidden />
}

function RichTextToolbar({
  editor,
  uploading,
  onImageClick,
}: {
  editor: Editor
  uploading: boolean
  onImageClick: () => void
}) {
  const setLink = useCallback(() => {
    const previous = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Enter link URL', previous ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  return (
    <div className="rich-text-editor__toolbar flex flex-wrap items-center gap-0.5 p-2">
      <HeadingDropdown editor={editor} />

      <ToolbarDivider />

      <ToolbarButton
        title="Bold"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Italic"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Underline"
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Strikethrough"
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        title="Bullet list"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Numbered list"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Quote"
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton title="Insert link" active={editor.isActive('link')} onClick={setLink}>
        <Link2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton title="Insert image" disabled={uploading} onClick={onImageClick}>
        <ImagePlus className={cn('h-4 w-4', uploading && 'animate-pulse')} />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton title="Clear formatting" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
        <Eraser className="h-4 w-4" />
      </ToolbarButton>
    </div>
  )
}

export function RichTextEditor({
  id,
  value,
  onChange,
  onBlur,
  placeholder = 'Write a description…',
  disabled = false,
  className,
  minHeight = 180,
  'aria-invalid': ariaInvalid,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const onChangeRef = useRef(onChange)
  const onBlurRef = useRef(onBlur)

  onChangeRef.current = onChange
  onBlurRef.current = onBlur

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        link: {
          openOnClick: false,
          HTMLAttributes: {
            rel: 'noopener noreferrer',
            target: '_blank',
          },
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || '',
    onUpdate: ({ editor: currentEditor }) => {
      onChangeRef.current(normalizeRichTextHtml(currentEditor.getHTML()))
    },
    editorProps: {
      attributes: {
        class: 'rich-text-editor__content focus:outline-none',
      },
      handleDOMEvents: {
        blur: () => {
          onBlurRef.current?.()
          return false
        },
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    editor.setEditable(!disabled)
  }, [disabled, editor])

  useEffect(() => {
    if (!editor) return
    const current = normalizeRichTextHtml(editor.getHTML())
    const next = normalizeRichTextHtml(value)
    if (current !== next) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
  }, [editor, value])

  async function handleImageUpload(files: FileList | null) {
    const file = files?.[0]
    if (!file || !editor) return

    setUploading(true)
    try {
      const body = new FormData()
      body.append('file', file)

      const response = await fetch('/api/admin/upload', { method: 'POST', body })
      const json = (await response.json()) as {
        data?: Array<{ url: string }>
        error?: string
      }
      if (!response.ok) throw new Error(json.error ?? 'Upload failed')

      const url = json.data?.[0]?.url
      if (!url) throw new Error('Upload failed')

      editor.chain().focus().setImage({ src: url, alt: file.name }).run()
      toast.success('Image inserted')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Image upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div
      id={id}
      className={cn(
        'rich-text-editor',
        ariaInvalid && 'rich-text-editor--invalid',
        disabled && 'rich-text-editor--disabled',
        className,
      )}
      style={{ '--rich-text-min-height': `${minHeight}px` } as CSSProperties}>
      {editor ? (
        <RichTextToolbar editor={editor} uploading={uploading} onImageClick={() => fileInputRef.current?.click()} />
      ) : null}

      <EditorContent editor={editor} />

      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="hidden"
        onChange={(event) => void handleImageUpload(event.target.files)}
      />
    </div>
  )
}
