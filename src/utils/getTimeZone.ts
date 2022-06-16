const getTimeZone = (timeZone: number): number => {
  if (timeZone < 0) {
    return Math.abs(timeZone) / 60;
  } if (timeZone > 0) {
    return timeZone / 60;
  }
  return 0;
};

export default getTimeZone;
