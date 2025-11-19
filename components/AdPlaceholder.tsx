export default function AdPlaceholder({
  title = '広告スペース（例）',
  description = 'Google AdSense 広告がここに表示されます。',
}: {
  title?: string
  description?: string
}) {
  return (
    <div className="w-full border-2 border-dashed border-orange-300 bg-orange-50/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
      <span className="text-xs uppercase tracking-[0.3em] text-orange-500 font-semibold mb-3">
        AD SPACE
      </span>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )
}

