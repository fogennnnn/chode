function formatElapsed(milliseconds) {
  if (typeof milliseconds !== 'number' || !isFinite(milliseconds) || milliseconds < 0) {
    return '0s';
  }

  const totalSeconds = Math.floor(milliseconds / 1000);

  if (totalSeconds === 0) {
    return '0s';
  }

  const hours = Math.floor(totalSeconds / 3600);
  const remainderAfterHours = totalSeconds % 3600;
  const minutes = Math.floor(remainderAfterHours / 60);
  const secondsPart = remainderAfterHours % 60;

  if (hours > 0) {
    return hours + 'h ' + minutes + 'm ' + secondsPart + 's';
  }

  if (minutes > 0) {
    return minutes + 'm ' + secondsPart + 's';
  }

  return secondsPart + 's';
}

module.exports = { formatElapsed };