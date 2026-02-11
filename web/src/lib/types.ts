export type TaskSection = 'today' | 'soon' | 'later' | 'waiting' | 'agenda' | 'inbox' | 'done' | 'reference';

export interface Task {
  id: number;
  content: string;
  section: TaskSection;
  completed: number;
  position: number;
  created_at: string;
  updated_at: string;
}

export type MemorySection = 'now' | 'open_threads' | 'parked' | 'people_context' | 'recent_decisions';

export interface MemoryItem {
  id: number;
  content: string;
  section: MemorySection;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface ScratchpadItem {
  id: number;
  content: string;
  processed: number;
  created_at: string;
}

export interface DailyNote {
  id: number;
  date: string;
  decisions: string;
  meetings_conversations: string;
  notes: string;
  summary: string;
  created_at: string;
  updated_at: string;
}

export interface Meeting {
  id: number;
  title: string;
  date: string;
  attendees: string;
  type: string;
  status: 'unprocessed' | 'processed';
  summary: string;
  action_items: string;
  key_points: string;
  raw_transcript: string;
  created_at: string;
  updated_at: string;
}
