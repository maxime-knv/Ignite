import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Task {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}

export interface DayLog {
  date: string;
  completed: boolean;
  tasksTotal: number;
  tasksDone: number;
}

export interface Friend {
  id: string;
  name: string;
  link?: string;
  currentStreak: number;
  bestStreak: number;
  dayLogs: DayLog[];
}

export interface AppState {
  hasOnboarded: boolean;
  setHasOnboarded: (v: boolean) => void;

  userName: string;
  setUserName: (name: string) => void;

  closeHour: number;
  setCloseHour: (hour: number) => void;
  notificationsEnabled: boolean;
  motivationEnabled: boolean;
  pomodoroSound: boolean;
  toggleNotifications: () => void;
  toggleMotivation: () => void;
  togglePomodoroSound: () => void;

  tasks: Task[];
  addTask: (text: string) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  clearDayTasks: () => void;

  selectedPomodoroTaskIds: string[];
  setSelectedPomodoroTaskIds: (ids: string[]) => void;

  dayLogs: DayLog[];
  currentStreak: number;
  bestStreak: number;
  closeDayLog: () => { streakValidated: boolean; tasksDone: number; tasksTotal: number };

  pomodoroCount: number;
  incrementPomodoro: () => void;

  friends: Friend[];
  addFriend: (name: string, link?: string) => void;
  removeFriend: (id: string) => void;
  updateFriendStreak: (id: string, currentStreak: number, bestStreak: number, dayLogs: DayLog[]) => void;
}

const getTodayStr = () => new Date().toISOString().split('T')[0];

const computeStreak = (logs: DayLog[]): { current: number; best: number } => {
  const completed = logs.filter(l => l.completed).map(l => l.date).sort().reverse();
  if (completed.length === 0) return { current: 0, best: 0 };
  const today = getTodayStr();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  let current = 0;
  let best = 0;
  let checkDate: string | null =
    completed[0] === today || completed[0] === yesterday ? completed[0] : null;
  if (checkDate) {
    let streak = 0;
    for (const date of completed) {
      if (date === checkDate) {
        streak++;
        const prevDay = new Date(checkDate as string);
        prevDay.setDate(prevDay.getDate() - 1);
        checkDate = prevDay.toISOString().split('T')[0];
      } else break;
    }
    current = streak;
  }
  let tempStreak = 1;
  for (let i = 1; i < completed.length; i++) {
    const diff =
      (new Date(completed[i - 1]).getTime() - new Date(completed[i]).getTime()) / 86400000;
    if (Math.abs(diff - 1) < 0.01) {
      tempStreak++;
    } else {
      best = Math.max(best, tempStreak);
      tempStreak = 1;
    }
  }
  best = Math.max(best, tempStreak, current);
  return { current, best };
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      hasOnboarded: false,
      setHasOnboarded: (v) => set({ hasOnboarded: v }),

      userName: '',
      setUserName: (name) => set({ userName: name }),

      closeHour: 19,
      setCloseHour: (hour) => set({ closeHour: hour }),
      notificationsEnabled: true,
      motivationEnabled: true,
      pomodoroSound: true,
      toggleNotifications: () => set(s => ({ notificationsEnabled: !s.notificationsEnabled })),
      toggleMotivation: () => set(s => ({ motivationEnabled: !s.motivationEnabled })),
      togglePomodoroSound: () => set(s => ({ pomodoroSound: !s.pomodoroSound })),

      tasks: [],
      addTask: (text) => {
        const task: Task = {
          id: Date.now().toString(),
          text: text.trim(),
          done: false,
          createdAt: new Date().toISOString(),
        };
        set(s => ({ tasks: [...s.tasks, task] }));
      },
      toggleTask: (id) =>
        set(s => ({ tasks: s.tasks.map(t => (t.id === id ? { ...t, done: !t.done } : t)) })),
      deleteTask: (id) => set(s => ({ tasks: s.tasks.filter(t => t.id !== id) })),
      clearDayTasks: () => set({ tasks: [] }),

      selectedPomodoroTaskIds: [],
      setSelectedPomodoroTaskIds: (ids) => set({ selectedPomodoroTaskIds: ids }),

      dayLogs: [],
      currentStreak: 0,
      bestStreak: 0,
      closeDayLog: () => {
        const today = getTodayStr();
        const { tasks, dayLogs, bestStreak } = get();
        const tasksDone = tasks.filter(t => t.done).length;
        const tasksTotal = tasks.length;
        const ratio = tasksTotal > 0 ? tasksDone / tasksTotal : 0;
        const streakValidated = ratio >= 2 / 3;
        const newLog: DayLog = {
          date: today,
          completed: streakValidated,
          tasksTotal,
          tasksDone,
        };
        const newLogs = [...dayLogs.filter(l => l.date !== today), newLog];
        const { current, best } = computeStreak(newLogs);
        set({
          dayLogs: newLogs,
          currentStreak: current,
          bestStreak: Math.max(best, bestStreak),
        });
        return { streakValidated, tasksDone, tasksTotal };
      },

      pomodoroCount: 0,
      incrementPomodoro: () => set(s => ({ pomodoroCount: s.pomodoroCount + 1 })),

      friends: [],
      addFriend: (name, link) => {
        const friend: Friend = {
          id: Date.now().toString(),
          name: name.trim(),
          link: link?.trim(),
          currentStreak: 0,
          bestStreak: 0,
          dayLogs: [],
        };
        set(s => ({ friends: [...s.friends, friend] }));
      },
      removeFriend: (id) => set(s => ({ friends: s.friends.filter(f => f.id !== id) })),
      updateFriendStreak: (id, currentStreak, bestStreak, dayLogs) => {
        set(s => ({
          friends: s.friends.map(f =>
            f.id === id ? { ...f, currentStreak, bestStreak, dayLogs } : f
          ),
        }));
      },
    }),
    { name: 'ignite-store', storage: createJSONStorage(() => AsyncStorage) }
  )
);
