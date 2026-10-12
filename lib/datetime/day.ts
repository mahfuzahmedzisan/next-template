/** Calendar days ("YYYY-MM-DD") as local-midnight Dates, for date pickers. */

export function dayToDate(day: string | null | undefined): Date | undefined {
  if (!day) return undefined;
  const [year, month, date] = day.split("-").map(Number);
  if (!year || !month || !date) return undefined;
  return new Date(year, month - 1, date);
}

export function dateToDay(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
