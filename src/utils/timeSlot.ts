const parseTime = (time: string): { hour: number; minute: number } => {
  const parts = time.split(":");

  if (parts.length !== 2) {
    throw new Error(`Invalid time format: ${time}`);
  }

  const hour = Number(parts[0]);
  const minute = Number(parts[1]);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    throw new Error(`Invalid time format: ${time}`);
  }

  return {
    hour,
    minute,
  };
};

export const generateTimeSlots = (
  start: string,
  end: string,
  durationMinutes: number,
): string[] => {
  const slots: string[] = [];

  const startTime = parseTime(start);
  const endTime = parseTime(end);

  let currentMinutes = startTime.hour * 60 + startTime.minute;

  const endMinutes = endTime.hour * 60 + endTime.minute;

  while (currentMinutes < endMinutes) {
    const hour = Math.floor(currentMinutes / 60);

    const minute = currentMinutes % 60;

    slots.push(
      `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`,
    );

    currentMinutes += durationMinutes;
  }

  return slots;
};
