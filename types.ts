export interface Doc {
  id: string;
  title: string;
  content: string;
  lastModified: number;
  type: 'general' | 'log' | 'inspection' | 'measurement' | 'visa';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isThinking?: boolean;
}

export enum TemplateType {
  BLANK = 'blank',
  CONSTRUCTION_LOG = 'construction_log',
  INSPECTION_RECORD = 'inspection_record',
  SAFETY_MEETING = 'safety_meeting',
  SITE_VISA = 'site_visa'
}

export interface Template {
  id: TemplateType;
  name: string;
  description: string;
  initialContent: string;
}