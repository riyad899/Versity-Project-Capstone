import { X } from 'lucide-react'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'

export default function EditStopModal({
  isOpen,
  onClose,
  editStopModal,
  setEditStopModal,
  onSubmit,
}) {
  if (!isOpen || !editStopModal) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-950">Rename Bus Stop</h3>
            <p className="text-xs text-slate-500">Route: {editStopModal.routeName}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Stop Name *</label>
            <Input
              type="text"
              value={editStopModal.newStopName || ''}
              onChange={(e) =>
                setEditStopModal({ ...editStopModal, newStopName: e.target.value })
              }
              placeholder="e.g. Science Building, Main Library"
              required
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Stop Name</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
