export interface VideoSegment {
  id: string;
  text: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  confidence: number;
}

export interface AnalysisState {
  status: 'idle' | 'processing' | 'success' | 'error';
  message: string;
}

export interface ProjectData {
  videoName: string;
  duration: number;
  segments: VideoSegment[];
}