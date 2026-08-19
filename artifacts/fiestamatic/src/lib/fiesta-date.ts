import { differenceInDays } from 'date-fns';

const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

function getWeekdayIndex(weekday: string): number {
  return WEEKDAYS.findIndex(d => d.toLowerCase() === weekday.toLowerCase());
}

function getMonthIndex(month: string): number {
  return MONTHS.findIndex(m => m.toLowerCase() === month.toLowerCase());
}

/**
 * Parses fiesta string and returns the Date for the current year.
 * If the date has already passed today, returns next year's date.
 */
export function getOrCreateFiestaDate(fiestaString: string, currentYear: number): Date {
  const normalizedStr = fiestaString.trim();
  
  // Pattern 1: "Month Nth Weekday" (e.g., "May 1st Saturday")
  const nthMatch = normalizedStr.match(/^([A-Za-z]+)\s+(\d+)(st|nd|rd|th)\s+([A-Za-z]+)$/i);
  if (nthMatch) {
    const [, month, nStr, , weekday] = nthMatch;
    const monthIdx = getMonthIndex(month);
    const targetWeekday = getWeekdayIndex(weekday);
    const n = parseInt(nStr, 10);
    
    let date = findNthWeekday(currentYear, monthIdx, targetWeekday, n);
    if (getDaysUntil(date) < 0) {
      date = findNthWeekday(currentYear + 1, monthIdx, targetWeekday, n);
    }
    return date;
  }

  // Pattern 2: "Month Last Weekday" (e.g., "May Last Saturday")
  const lastMatch = normalizedStr.match(/^([A-Za-z]+)\s+Last\s+([A-Za-z]+)$/i);
  if (lastMatch) {
    const [, month, weekday] = lastMatch;
    const monthIdx = getMonthIndex(month);
    const targetWeekday = getWeekdayIndex(weekday);
    
    let date = findLastWeekday(currentYear, monthIdx, targetWeekday);
    if (getDaysUntil(date) < 0) {
      date = findLastWeekday(currentYear + 1, monthIdx, targetWeekday);
    }
    return date;
  }

  // Pattern 3: "Month Day" (e.g., "November 25")
  const exactMatch = normalizedStr.match(/^([A-Za-z]+)\s+(\d+)$/i);
  if (exactMatch) {
    const [, month, dayStr] = exactMatch;
    const monthIdx = getMonthIndex(month);
    const day = parseInt(dayStr, 10);
    
    let date = new Date(currentYear, monthIdx, day);
    if (getDaysUntil(date) < 0) {
      date = new Date(currentYear + 1, monthIdx, day);
    }
    return date;
  }

  // Fallback (should not happen with our dataset)
  return new Date();
}

function findNthWeekday(year: number, month: number, targetWeekday: number, n: number): Date {
  const date = new Date(year, month, 1);
  let count = 0;
  
  while (date.getMonth() === month) {
    if (date.getDay() === targetWeekday) {
      count++;
      if (count === n) return new Date(date);
    }
    date.setDate(date.getDate() + 1);
  }
  return date; // fallback
}

function findLastWeekday(year: number, month: number, targetWeekday: number): Date {
  // Start from last day of month
  const date = new Date(year, month + 1, 0); 
  
  while (date.getMonth() === month) {
    if (date.getDay() === targetWeekday) {
      return new Date(date);
    }
    date.setDate(date.getDate() - 1);
  }
  return date;
}

export function getDaysUntil(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return differenceInDays(target, today);
}

export function getCountdownLabel(date: Date): string {
  const days = getDaysUntil(date);
  
  if (days < 0) return `Happened ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`;
  if (days === 0) return "Today!";
  if (days === 1) return "Tomorrow!";
  if (days <= 30) return `Happening in ${days} days`;
  
  const weeks = Math.floor(days / 7);
  if (days <= 90) return `In ${weeks} weeks`;
  
  const months = Math.floor(days / 30);
  return `In ${months} months`;
}
