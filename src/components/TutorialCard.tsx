import React, { useState } from 'react';
import { Bookmark, ExternalLink, Play, X } from 'lucide-react';
import { YouTubeTutorial } from '../types';

interface TutorialCardProps {
  tutorial: YouTubeTutorial;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
}

export const TutorialCard: React.FC<TutorialCardProps> = ({ tutorial, isSaved, onToggleSave }) => {
  const [playing, setPlaying] = useState(false);
  const thumbnailUrl = `https://img.youtube.com/vi/${tutorial.videoId}/hqdefault.jpg`;
  const youtubeUrl = `https://www.youtube.com/watch?v=${tutorial.videoId}`;

  return (
    <div className="athletic-card athletic-card-hover rounded-2xl overflow-hidden flex flex-col justify-between">
      <div>
        <div className="relative aspect-video bg-[#24552E] overflow-hidden">
          {playing ? (
            <>
              <iframe
                src={`https://www.youtube.com/embed/${tutorial.videoId}?autoplay=1`}
                title={tutorial.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
              <button
                onClick={() => setPlaying(false)}
                aria-label="Close video player"
                className="absolute top-2.5 right-2.5 bg-[#17251A]/85 text-white p-1.5 rounded-lg hover:bg-[#17251A] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setPlaying(true)}
              className="group relative w-full h-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A8D94E]"
            >
              <img
                src={thumbnailUrl}
                alt={tutorial.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#24552E]/85 via-[#397B32]/25 to-transparent flex items-center justify-center">
                <span className="w-12 h-12 rounded-full bg-[#A8D94E] text-[#17251A] flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-105">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </span>
              </div>
              <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-white font-mono">
                <span>{tutorial.channel}</span>
                <span className="tabular-nums text-[#A8D94E] font-semibold">{tutorial.duration}</span>
              </div>
            </button>
          )}
        </div>

        <div className="p-5">
          <div className="flex items-center gap-2 text-xs text-[#397B32] font-semibold mb-1.5">
            <span>{tutorial.category}</span>
            <span aria-hidden="true">·</span>
            <span>{tutorial.level}</span>
          </div>
          <h4 className="font-display text-xl font-bold text-[#17251A] leading-snug mb-2">
            {tutorial.title}
          </h4>
          <p className="text-sm text-[#68766A] leading-relaxed">{tutorial.summary}</p>
        </div>
      </div>

      <div className="px-5 py-3.5 border-t border-[#17251A]/8 flex items-center justify-between gap-2 bg-[#F7FAF3]">
        <button
          onClick={() => setPlaying((p) => !p)}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#397B32] text-white text-xs font-bold hover:bg-[#24552E] transition-colors whitespace-nowrap shrink-0"
        >
          {playing ? 'Show Thumbnail' : 'Watch Inside CRICKIFY'}
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleSave(tutorial.id)}
            aria-label={isSaved ? 'Remove tutorial from saved' : 'Save tutorial'}
            className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 rounded-xl border text-xs transition-colors ${
              isSaved
                ? 'bg-[#A8D94E]/25 border-[#397B32] text-[#24552E]'
                : 'bg-white border-[#17251A]/12 text-[#68766A] hover:text-[#17251A]'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#17251A]/12 text-xs font-semibold text-[#17251A] hover:bg-[#EDF3E8] transition-colors whitespace-nowrap shrink-0"
          >
            YouTube <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
