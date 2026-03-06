export interface Activity {
    id: string;
    time: string;
    endTime: string;
    title: string;
    status: 'completed' | 'current' | 'upcoming';
    icon: string;
    durationMinutes?: number;
    color?: string;
}

export interface CurrentActivityCardProps {
    activity: Activity;
    onComplete: () => void;
    timerActive: boolean;
    timeRemaining: number;
    progress: number;
    onStartTimer: () => void;
    onPauseTimer: () => void;
    onResetTimer: () => void;
    formatTime: (seconds: number) => string;
    timerStarted: boolean;
}

export interface TimelineItemProps {
    activity: Activity;
    isLast: boolean;
    onEdit: (id: string) => void;
    onComplete: (id: string) => void;
}

export interface NewActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (activity: Omit<Activity, 'id' | 'status'>) => void;
    editActivity?: Activity | null;
    onDelete?: () => void;
    onDuplicate?: () => void;
}

export interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    activityTitle: string;
}

// Icon picker options
export const ACTIVITY_ICONS = [
    '☀️', '📚', '🔢', '📖', '✏️', '🎨', '🎵', '⚽', '🍎', '🥪',
    '🧘', '💤', '🚿', '👕', '🚌', '🏠', '💊', '🎮', '📺', '🧹'
];
