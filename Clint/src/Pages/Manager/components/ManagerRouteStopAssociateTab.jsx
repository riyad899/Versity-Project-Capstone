import { MapPin, Route, ArrowRight, Construction, CheckCircle2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'

export default function ManagerRouteStopAssociateTab({ routes = [] }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Route Stop Associate
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Configure bus stops between initial origin and destination terminals.
          </p>
        </div>
        <Badge variant="softBlue" className="px-3 py-1.5 text-xs font-bold self-start sm:self-auto flex items-center gap-1.5">
          <Construction className="h-3.5 w-3.5 text-blue-600" />
          Branch Implementation Pending
        </Badge>
      </div>

      <Card className="border-slate-200/90 shadow-sm bg-gradient-to-br from-white to-slate-50/50">
        <CardHeader className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-950">
                Intermediate Stop Association Feature
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                This feature allows Transportation Managers to add, reorder, rename, and remove intermediate stops along any transit pathway.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-xs text-blue-900 leading-relaxed">
            <p className="font-bold mb-1">Architecture Note:</p>
            This module has been prepared for dedicated branch implementation. See{' '}
            <code className="font-mono font-bold text-blue-700 bg-blue-100/80 px-1 py-0.5 rounded">
              STOP_ASSOCIATED_IMPLEMENTATION.md
            </code>{' '}
            for full schema, backend controller, routes, and UI specifications.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-slate-200/80 bg-white">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Origin Station</h4>
              <p className="mt-1 text-sm font-semibold text-slate-900">Start Terminal</p>
              <p className="mt-0.5 text-xs text-slate-400">First pickup point</p>
            </div>
            <div className="p-4 rounded-xl border border-dashed border-blue-300 bg-blue-50/30">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600">Intermediate Stops</h4>
              <p className="mt-1 text-sm font-semibold text-slate-900">Configurable Stops Array</p>
              <p className="mt-0.5 text-xs text-slate-500">Stops visited sequentially</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200/80 bg-white">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Destination Terminal</h4>
              <p className="mt-1 text-sm font-semibold text-slate-900">End Terminal</p>
              <p className="mt-0.5 text-xs text-slate-400">Final drop-off point</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
