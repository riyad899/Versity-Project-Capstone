import { useState, useEffect, useCallback } from 'react'
import apiClient from '../../Hooks/Axios'
import toast from 'react-hot-toast'
import {
  AlertTriangle,
  CheckCircle2,
  GitBranch,
  Gauge,
  Clock,
  RefreshCw,
  Navigation,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'

export default function TrafficAndAlternativesPanel({
  routeId,
  canReport = false,
  selectedAlternative,
  onSelectAlternative,
  onTrafficDataLoaded,
}) {
  const [trafficData, setTrafficData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [reporting, setReporting] = useState(false)

  const fetchTraffic = useCallback(async () => {
    if (!routeId) return
    setLoading(true)
    try {
      const res = await apiClient.get(`/api/v1/traffic/route/${routeId}`)
      const data = res.data?.data || null
      setTrafficData(data)
      if (onTrafficDataLoaded) {
        onTrafficDataLoaded(data)
      }
    } catch (err) {
      console.error('Failed to fetch traffic info:', err)
    } finally {
      setLoading(false)
    }
  }, [routeId, onTrafficDataLoaded])

  useEffect(() => {
    fetchTraffic()
  }, [fetchTraffic])

  const handleReportTraffic = async (level) => {
    if (!routeId) return
    setReporting(true)
    try {
      const res = await apiClient.post(`/api/v1/traffic/route/${routeId}/report`, {
        level,
        note: `Live condition reported as ${level}`,
      })
      const data = res.data?.data || null
      setTrafficData(data)
      if (onTrafficDataLoaded) {
        onTrafficDataLoaded(data)
      }
      toast.success(`Traffic condition reported: ${level.toUpperCase()}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to report traffic')
    } finally {
      setReporting(false)
    }
  }

  if (!routeId) return null

  const traffic = trafficData?.traffic
  const level = traffic?.level || 'clear'
  const alternatives = trafficData?.alternativeRoutes || []

  const levelStyles = {
    clear: {
      badge: 'softGreen',
      label: 'Clear / Smooth',
      border: 'border-emerald-200',
      bg: 'bg-emerald-50/50',
      text: 'text-emerald-800',
    },
    moderate: {
      badge: 'softAmber',
      label: 'Moderate Traffic',
      border: 'border-amber-200',
      bg: 'bg-amber-50/60',
      text: 'text-amber-800',
    },
    heavy: {
      badge: 'softRed',
      label: 'Heavy Congestion',
      border: 'border-rose-200',
      bg: 'bg-rose-50/60',
      text: 'text-rose-800',
    },
  }

  const style = levelStyles[level] || levelStyles.clear

  return (
    <Card className="border-slate-200/90 shadow-sm bg-white">
      <CardHeader className="py-3.5 px-5 border-b border-slate-100 flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-blue-600" />
          <CardTitle className="text-sm font-bold text-slate-900">
            Live Traffic &amp; Alternative Routes
          </CardTitle>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={fetchTraffic}
          disabled={loading}
          className="h-7 px-2 text-xs text-slate-500"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {loading && !trafficData ? (
          <div className="py-6 text-center text-xs text-slate-500">
            Analyzing road traffic &amp; alternative corridors...
          </div>
        ) : trafficData ? (
          <>
            {/* Traffic Status Box */}
            <div className={`rounded-xl border p-3.5 space-y-2.5 ${style.border} ${style.bg}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {level === 'clear' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle
                      className={`h-4 w-4 shrink-0 ${
                        level === 'heavy' ? 'text-rose-600' : 'text-amber-600'
                      }`}
                    />
                  )}
                  <span className={`text-xs font-bold ${style.text}`}>{style.label}</span>
                </div>
                <Badge variant={style.badge} className="text-[10px] font-bold">
                  {traffic?.congestionScore ?? 20}% Load
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                <div className="bg-white/80 rounded-lg p-2 border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">Distance</span>
                  <strong className="text-slate-900">{trafficData.distanceKm || '—'} km</strong>
                </div>
                <div className="bg-white/80 rounded-lg p-2 border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">Est. Travel</span>
                  <strong className="text-slate-900">{trafficData.estimatedDurationMin} min</strong>
                </div>
                <div className="bg-white/80 rounded-lg p-2 border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px]">Delay</span>
                  <strong
                    className={
                      trafficData.estimatedDelayMin > 0 ? 'text-rose-600' : 'text-emerald-600'
                    }
                  >
                    +{trafficData.estimatedDelayMin} min
                  </strong>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                <span className="flex items-center gap-1">
                  <Gauge className="h-3 w-3" /> Avg: {traffic?.avgSpeedKmh} km/h
                </span>
                <span className="truncate max-w-[160px]" title={traffic?.source}>
                  {traffic?.source}
                </span>
              </div>
            </div>

            {/* Driver Quick Traffic Report */}
            {canReport && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Report Live Road Condition
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    disabled={reporting}
                    onClick={() => handleReportTraffic('clear')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all ${
                      level === 'clear'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    🟢 Clear
                  </button>
                  <button
                    type="button"
                    disabled={reporting}
                    onClick={() => handleReportTraffic('moderate')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all ${
                      level === 'moderate'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
                    }`}
                  >
                    🟡 Moderate
                  </button>
                  <button
                    type="button"
                    disabled={reporting}
                    onClick={() => handleReportTraffic('heavy')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all ${
                      level === 'heavy'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                    }`}
                  >
                    🔴 Heavy
                  </button>
                </div>
              </div>
            )}

            {/* Suggested Alternative Routes */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Navigation className="h-3 w-3 text-cyan-600" />
                  Alternative Route Suggestions ({alternatives.length})
                </span>
                {trafficData.shouldSuggestAlternative && (
                  <Badge variant="softAmber" className="text-[10px]">
                    Recommended
                  </Badge>
                )}
              </div>

              {alternatives.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">
                  Set origin &amp; destination coordinates on the route to compute alternative paths.
                </p>
              ) : (
                <div className="space-y-2">
                  {alternatives.map((alt) => {
                    const isPreviewing = selectedAlternative?.id === alt.id
                    return (
                      <div
                        key={alt.id}
                        className={`rounded-xl border p-3 transition-all space-y-1.5 ${
                          isPreviewing
                            ? 'border-cyan-500 bg-cyan-50/50 ring-1 ring-cyan-400'
                            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900 leading-tight">
                            {alt.name}
                          </span>
                          {alt.timeSavedMinutes > 0 && (
                            <Badge variant="softGreen" className="text-[10px] shrink-0">
                              Save ~{alt.timeSavedMinutes}m
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">{alt.reason}</p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] font-mono text-slate-500 flex items-center gap-2">
                            <span>{alt.distanceKm} km</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <Clock className="h-2.5 w-2.5" /> {alt.estimatedMinutes} min
                            </span>
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            variant={isPreviewing ? 'default' : 'outline'}
                            onClick={() => onSelectAlternative(isPreviewing ? null : alt)}
                            className={`h-7 px-2.5 text-[11px] font-bold ${
                              isPreviewing ? 'bg-cyan-600 hover:bg-cyan-700 text-white' : ''
                            }`}
                          >
                            {isPreviewing ? (
                              <>
                                <EyeOff className="h-3 w-3 mr-1" /> Hide Route
                              </>
                            ) : (
                              <>
                                <Eye className="h-3 w-3 mr-1" /> Preview on Map
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
