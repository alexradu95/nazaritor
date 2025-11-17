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

type CollectionFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    title: string
    content: string
    properties: { objectType: string }
  }) => void
  defaultValues?: {
    title?: string
    content?: string
    properties?: { objectType: string }
  }
}

const OBJECT_TYPES = [
  { value: 'page', label: 'Pages' },
  { value: 'task', label: 'Tasks' },
  { value: 'project', label: 'Projects' },
  { value: 'resource', label: 'Resources' },
  { value: 'weblink', label: 'Web Links' },
  { value: 'person', label: 'People' },
]

export function CollectionFormDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
}: CollectionFormDialogProps) {
  const [title, setTitle] = useState(defaultValues?.title || '')
  const [content, setContent] = useState(defaultValues?.content || '')
  const [objectType, setObjectType] = useState(
    defaultValues?.properties?.objectType || 'page'
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ title, content, properties: { objectType } })
    onOpenChange(false)
    // Reset form
    setTitle('')
    setContent('')
    setObjectType('page')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {defaultValues ? 'Edit Collection' : 'Create Collection'}
            </DialogTitle>
            <DialogDescription>
              {defaultValues
                ? 'Update the collection details below.'
                : 'Create a new collection to group related objects.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter collection name..."
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="objectType">Object Type</Label>
              <Select value={objectType} onValueChange={setObjectType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select object type" />
                </SelectTrigger>
                <SelectContent>
                  {OBJECT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Only objects of this type can be added to this collection.
              </p>
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
