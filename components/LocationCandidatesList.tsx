import type { LocationCandidate } from '@/lib/types/locationCandidate'

interface LocationCandidatesListProps {
  candidates: LocationCandidate[]
  onRemove: (id: string) => void
}

/**
 * 追加された候補のリストを表示するコンポーネント
 */
export default function LocationCandidatesList({
  candidates,
  onRemove,
}: LocationCandidatesListProps) {
  if (candidates.length === 0) {
    return null
  }

  return (
    <div className="space-y-3 mt-6">
      <div className="flex items-center gap-3 mb-1">
        <i className="ri-checkbox-circle-line text-green-600 text-xl"></i>
        <p className="text-base font-bold text-gray-800">
          追加された候補 ({candidates.length}件)
        </p>
      </div>
      {candidates.map((candidate, index) => (
        <div
          key={candidate.id}
          className="p-4 bg-green-50 border-2 border-green-200 rounded-xl hover:bg-green-100 hover:border-green-300 transition-all animate-fade-in"
          style={{ animationDelay: `${index * 40}ms` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                <i className="ri-check-line text-white text-lg"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-gray-900 leading-tight mb-1">
                  {candidate.name}
                </p>
                {candidate.restaurantAddress && (
                  <p className="text-sm text-gray-600 flex items-start gap-1.5">
                    <i className="ri-map-pin-line text-green-500 mt-0.5 text-base flex-shrink-0"></i>
                    <span className="leading-relaxed break-words">
                      {candidate.restaurantAddress}
                    </span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {candidate.restaurantAddress && (
                <button
                  type="button"
                  onClick={() => {
                    const query = candidate.restaurantAddress
                      ? `${candidate.name} ${candidate.restaurantAddress}`
                      : candidate.name
                    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
                    window.open(url, '_blank', 'noopener,noreferrer')
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
                  title="Googleマップで開く"
                >
                  <i className="ri-map-pin-2-line text-sm"></i>
                  地図
                </button>
              )}
              <button
                type="button"
                onClick={() => onRemove(candidate.id)}
                className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                title="削除"
              >
                <i className="ri-close-line text-sm"></i>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

