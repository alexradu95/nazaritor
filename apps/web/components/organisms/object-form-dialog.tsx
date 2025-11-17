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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type ObjectFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    title: string
    type: string
    content: string
  }) => void
  defaultValues?: {
    title?: string
    type?: string
    content?: string
  }
}

const OBJECT_TYPES = [
  { value: 'page', label: 'Page' },
  { value: 'task', label: 'Task' },
  { value: 'project', label: 'Project' },
  { value: 'daily-note', label: 'Daily Note' },
  { value: 'resource', label: 'Resource' },
  { value: 'weblink', label: 'Web Link' },
  { value: 'person', label: 'Person' },
  { value: 'calendar-entry', label: 'Calendar Entry' },
  { value: 'custom', label: 'Custom' },
]

export function ObjectFormDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
}: ObjectFormDialogProps) {
  const [title, setTitle] = useState(defaultValues?.title || '')
  const [type, setType] = useState(defaultValues?.type || 'page')
  const [content, setContent] = useState(defaultValues?.content || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ title, type, content })
    onOpenChange(false)
    // Reset form
    setTitle('')
    setType('page')
    setContent('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {defaultValues ? 'Edit Object' : 'Create Object'}
            </DialogTitle>
            <DialogDescription>
              {defaultValues
                ? 'Update the object details below.'
                : 'Create a new object to organize your knowledge.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title..."
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {OBJECT_TYPES.map((objectType) => (
                    <SelectItem key={objectType.value} value={objectType.value}>
                      {objectType.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter content..."
                rows={5}
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
