import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, User, Bot, Link2, Image as ImageIcon, ExternalLink, X } from 'lucide-react';

export interface RichContent {
  type: 'link' | 'image';
  url: string;
  title?: string;
  caption?: string;
}

export interface SubtitleEntry {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  richContent?: RichContent;
}

export interface SubtitleDisplayProps {
  subtitles: SubtitleEntry[];
}

function formatTime(ts: number): string {
  const date = new Date(ts);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

// URL 正则
const URL_REGEX = /(https?:\/\/[^\s<>"']+)/g;

// 判断 URL 是否为图片
function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?|$)/i.test(url);
}

// 将纯文本渲染为带可点击 URL 的 JSX，图片 URL 自动内联显示
function renderTextWithLinks(text: string, onImageClick: (url: string) => void) {
  const parts = text.split(URL_REGEX);
  return parts.map((part, i) => {
    if (URL_REGEX.test(part)) {
      if (isImageUrl(part)) {
        return (
          <div key={i} className="mt-1.5 max-w-[95%]">
            <img
              src={part}
              alt=""
              className="rounded-xl max-h-48 object-cover cursor-pointer border border-white/10 hover:border-indigo-500/30 transition-all"
              loading="lazy"
              onClick={() => onImageClick(part)}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        );
      }
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:text-indigo-300 underline decoration-indigo-400/40 hover:decoration-indigo-300 transition-colors break-all"
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

// 链接卡片组件
function LinkCard({ url, title }: { url: string; title: string }) {
  let domain = '';
  try {
    domain = new URL(url).hostname.replace('www.', '');
  } catch {}

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block max-w-[95%] mt-1.5 group"
    >
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/15 hover:border-indigo-500/30 transition-all">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
          <Link2 className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-indigo-50 font-medium truncate group-hover:text-white transition-colors">
            {title}
          </p>
          <p className="text-xs text-indigo-400/60 truncate">{domain}</p>
        </div>
        <ExternalLink className="w-3.5 h-3.5 text-indigo-400/40 group-hover:text-indigo-300 shrink-0 transition-colors" />
      </div>
    </a>
  );
}

// 图片卡片组件（可点击放大）
function ImageCard({ url, caption, onClick }: { url: string; caption?: string; onClick: () => void }) {
  return (
    <div className="max-w-[95%] mt-1.5 rounded-xl overflow-hidden bg-zinc-800/50 border border-white/10 hover:border-indigo-500/30 transition-all cursor-pointer" onClick={onClick}>
      <img
        src={url}
        alt={caption || ''}
        className="w-full max-h-48 object-cover"
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
      {caption && (
        <div className="flex items-center gap-1.5 px-3 py-2 text-xs text-zinc-400">
          <ImageIcon className="w-3 h-3 shrink-0" />
          <span>{caption}</span>
        </div>
      )}
    </div>
  );
}

// 图片放大 Lightbox
function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 cursor-pointer"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        onClick={onClose}
      >
        <X className="w-5 h-5" />
      </button>
      <img
        src={url}
        alt=""
        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export default function SubtitleDisplay({ subtitles }: SubtitleDisplayProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [subtitles]);

  const recentSubtitles = subtitles.slice(-20);

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
          {recentSubtitles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-600 py-6">
              <MessageSquare className="w-6 h-6 mb-1.5 opacity-40" />
              <p className="text-xs italic">等待对话开始...</p>
            </div>
          ) : (
            recentSubtitles.map((entry, idx) => {
              const isUser = entry.role === 'user';
              const prevEntry = idx > 0 ? recentSubtitles[idx - 1] : null;
              const showLabel = !prevEntry || prevEntry.role !== entry.role ||
                (entry.timestamp - prevEntry.timestamp > 60000);

              return (
                <div
                  key={entry.id}
                  className={`flex flex-col gap-0.5 ${isUser ? 'items-start' : 'items-end'}`}
                >
                  {showLabel && (
                    <div
                      className={`flex items-center gap-1 text-[10px] uppercase tracking-wide ${
                        isUser ? 'text-emerald-400/60' : 'text-indigo-400/60'
                      }`}
                    >
                      {isUser ? (
                        <User className="w-2.5 h-2.5" />
                      ) : (
                        <Bot className="w-2.5 h-2.5" />
                      )}
                      <span className="font-semibold">{isUser ? '你' : 'AI'}</span>
                      <span className="text-zinc-700 font-mono">{formatTime(entry.timestamp)}</span>
                    </div>
                  )}

                  {/* 富内容卡片 */}
                  {entry.richContent?.type === 'link' && (
                    <LinkCard url={entry.richContent.url} title={entry.richContent.title || entry.richContent.url} />
                  )}
                  {entry.richContent?.type === 'image' && (
                    <ImageCard
                      url={entry.richContent.url}
                      caption={entry.richContent.caption}
                      onClick={() => setLightboxUrl(entry.richContent!.url)}
                    />
                  )}

                  {/* 文本气泡（自动检测 URL 和图片 URL） */}
                  {entry.text && !entry.richContent && (
                    <div
                      className={`max-w-[90%] px-3 py-1.5 rounded-2xl text-sm leading-snug break-words ${
                        isUser
                          ? 'bg-emerald-500/10 text-emerald-50 border border-emerald-500/10 rounded-tl-md'
                          : 'bg-indigo-500/10 text-indigo-50 border border-indigo-500/10 rounded-tr-md'
                      }`}
                    >
                      {renderTextWithLinks(entry.text, setLightboxUrl)}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* 图片放大 Lightbox */}
      {lightboxUrl && (
        <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}
    </>
  );
}
