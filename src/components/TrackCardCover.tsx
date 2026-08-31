import { getTrackStyle } from '@/data/track-config';

interface Props {
  trackSlug: string;
  isOpcSelected?: boolean;
  isZh?: boolean;
}

export function TrackCardCover({ trackSlug, isOpcSelected, isZh = true }: Props) {
  const style = getTrackStyle(trackSlug);
  
  return (
    <div className={`h-40 bg-gradient-to-br ${style.gradient} relative overflow-hidden`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-6xl opacity-30">{style.icon}</div>
      </div>
      {isOpcSelected && (
        <div className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium bg-white/90 text-blue-600">
          {isZh ? 'OPC精选' : 'OPC Pick'}
        </div>
      )}
    </div>
  );
}
