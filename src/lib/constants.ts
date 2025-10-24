// Timeline Configuration Constants

export const TIMELINE_CONFIG = {
  // Time settings
  START_HOUR: 11,
  END_HOUR: 24, // Midnight (0)
  SLOT_MINUTES: 15,
  
  // Grid dimensions
  SLOT_WIDTH: 60, // pixels per 15-minute slot
  ROW_HEIGHT: 60, // pixels per table row
  HEADER_HEIGHT: 50,
  SECTOR_HEADER_HEIGHT: 40,
  
  // Reservation defaults
  DEFAULT_DURATION_MINUTES: 90,
  MIN_DURATION_MINUTES: 30,
  MAX_DURATION_MINUTES: 240, // 4 hours
  
  // Visual
  BORDER_WIDTH: 1,
  TIMEZONE: 'America/Argentina/Buenos_Aires',
} as const;

// Calculate total slots (11:00 to 00:00 = 13 hours = 52 slots)
export const TOTAL_SLOTS = ((TIMELINE_CONFIG.END_HOUR - TIMELINE_CONFIG.START_HOUR) * 60) / TIMELINE_CONFIG.SLOT_MINUTES;

// Status colors
export const STATUS_COLORS: Record<string, string> = {
  PENDING: '#FCD34D',      // Yellow
  CONFIRMED: '#3B82F6',    // Blue
  SEATED: '#10B981',       // Green
  FINISHED: '#9CA3AF',     // Gray
  NO_SHOW: '#EF4444',      // Red
  CANCELLED: '#6B7280',    // Dark Gray
};

// Status text colors (for contrast)
export const STATUS_TEXT_COLORS: Record<string, string> = {
  PENDING: '#78350F',
  CONFIRMED: '#1E3A8A',
  SEATED: '#064E3B',
  FINISHED: '#1F2937',
  NO_SHOW: '#7F1D1D',
  CANCELLED: '#1F2937',
};

// Priority badges
export const PRIORITY_LABELS: Record<string, string> = {
  STANDARD: '',
  VIP: 'VIP',
  LARGE_GROUP: 'Large Group',
};

export const PRIORITY_COLORS: Record<string, string> = {
  STANDARD: '',
  VIP: '#8B5CF6',        // Purple
  LARGE_GROUP: '#F59E0B', // Amber
};


