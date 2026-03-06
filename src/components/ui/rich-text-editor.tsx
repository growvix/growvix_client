import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Link as LinkIcon,
    List,
    ListOrdered,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Heading2,
    Quote,
    Undo,
    Redo,
    Strikethrough,
} from 'lucide-react'
import { Separator } from './separator'

interface RichTextEditorProps {
    value?: string
    onChange?: (html: string) => void
    placeholder?: string
    className?: string
    minHeight?: string
}

const ToolbarButton = ({
    onClick,
    active,
    title,
    children,
}: {
    onClick: () => void
    active?: boolean
    title: string
    children: React.ReactNode
}) => (
    <Button
        type="button"
        variant="ghost"
        size="icon"
        title={title}
        className={cn(
            'h-7 w-7 rounded',
            active && 'bg-muted text-foreground'
        )}
        onClick={onClick}
    >
        {children}
    </Button>
)

export function RichTextEditor({
    value = '',
    onChange,
    placeholder = 'Write your message…',
    className,
    minHeight = '200px',
}: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Placeholder.configure({ placeholder }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: { class: 'text-blue-500 underline cursor-pointer' },
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange?.(editor.getHTML())
        },
        editorProps: {
            attributes: {
                class: 'outline-none min-h-[var(--editor-min-height)] px-4 py-3 prose prose-sm dark:prose-invert max-w-none',
                style: `--editor-min-height: ${minHeight}`,
            },
        },
    })

    // Sync external value changes (e.g. reset)
    useEffect(() => {
        if (editor && value === '') {
            editor.commands.clearContent()
        }
    }, [value, editor])

    const setLink = () => {
        const previousUrl = editor?.getAttributes('link').href
        const url = window.prompt('URL', previousUrl)
        if (url === null) return
        if (url === '') {
            editor?.chain().focus().extendMarkRange('link').unsetLink().run()
            return
        }
        editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }

    if (!editor) return null

    return (
        <div className={cn('rounded-lg border bg-background overflow-hidden', className)}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b bg-muted/30">
                <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()}>
                    <Undo className="size-3.5" />
                </ToolbarButton>
                <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()}>
                    <Redo className="size-3.5" />
                </ToolbarButton>

                <Separator orientation="vertical" className="h-5 mx-1" />

                <ToolbarButton
                    title="Heading"
                    active={editor.isActive('heading', { level: 2 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                >
                    <Heading2 className="size-3.5" />
                </ToolbarButton>
                <ToolbarButton
                    title="Bold"
                    active={editor.isActive('bold')}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                >
                    <Bold className="size-3.5" />
                </ToolbarButton>
                <ToolbarButton
                    title="Italic"
                    active={editor.isActive('italic')}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                    <Italic className="size-3.5" />
                </ToolbarButton>
                <ToolbarButton
                    title="Underline"
                    active={editor.isActive('underline')}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                >
                    <UnderlineIcon className="size-3.5" />
                </ToolbarButton>
                <ToolbarButton
                    title="Strikethrough"
                    active={editor.isActive('strike')}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                >
                    <Strikethrough className="size-3.5" />
                </ToolbarButton>

                <Separator orientation="vertical" className="h-5 mx-1" />

                <ToolbarButton
                    title="Bullet list"
                    active={editor.isActive('bulletList')}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                >
                    <List className="size-3.5" />
                </ToolbarButton>
                <ToolbarButton
                    title="Ordered list"
                    active={editor.isActive('orderedList')}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                >
                    <ListOrdered className="size-3.5" />
                </ToolbarButton>
                <ToolbarButton
                    title="Blockquote"
                    active={editor.isActive('blockquote')}
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                >
                    <Quote className="size-3.5" />
                </ToolbarButton>

                <Separator orientation="vertical" className="h-5 mx-1" />

                <ToolbarButton
                    title="Align left"
                    active={editor.isActive({ textAlign: 'left' })}
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                >
                    <AlignLeft className="size-3.5" />
                </ToolbarButton>
                <ToolbarButton
                    title="Align center"
                    active={editor.isActive({ textAlign: 'center' })}
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                >
                    <AlignCenter className="size-3.5" />
                </ToolbarButton>
                <ToolbarButton
                    title="Align right"
                    active={editor.isActive({ textAlign: 'right' })}
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                >
                    <AlignRight className="size-3.5" />
                </ToolbarButton>

                <Separator orientation="vertical" className="h-5 mx-1" />

                <ToolbarButton title="Insert link" active={editor.isActive('link')} onClick={setLink}>
                    <LinkIcon className="size-3.5" />
                </ToolbarButton>
            </div>

            {/* Editor area */}
            <EditorContent editor={editor} />
        </div>
    )
}
