'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type TagFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { title: string; content: string }) => void
  defaultValues?: {
    title?: string
    content?: string
  }
}

export function TagFormDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
}: TagFormDialogProps) {
  const [title, setTitle] = useState(defaultValues?.title || '')
  const [content, setContent] = useState(defaultValues?.content || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ title, content })
    onOpenChange(false)
    // Reset form
    setTitle('')
    setContent('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{defaultValues ? 'Edit Tag' : 'Create Tag'}</DialogTitle>
            <DialogDescription>
              {defaultValues
                ? 'Update the tag details below.'
                : 'Create a new tag to categorize your objects.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Name</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter tag name..."
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Description</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter description..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {defaultValues ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
