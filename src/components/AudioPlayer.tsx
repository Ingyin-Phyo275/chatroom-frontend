import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";

interface AudioMessageProps {
  file: File | string;
}

export default function AudioMessage({ file }: AudioMessageProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setProgress(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="flex items-center gap-2 bg-gray-200 dark:bg-slate-700 rounded-lg px-3 py-2 max-w-[250px]">
      <button onClick={togglePlay} className="p-1">
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>
      <div className="flex-1 h-1 rounded bg-gray-400 dark:bg-gray-600 relative">
        <div
          className="h-1 rounded bg-sky-600 dark:bg-sky-500 absolute left-0 top-0"
          style={{ width: `${(progress / duration) * 100 || 0}%` }}
        />
      </div>
      <span className="text-xs text-gray-600 dark:text-gray-300">
        {formatTime(progress)} / {formatTime(duration)}
      </span>
<audio ref={audioRef} src={typeof file === 'string' ? file : URL.createObjectURL(file)} className="hidden" />    </div>
  );
}
