export async function shareCourse({ title, url }) {
  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return 'shared';
    } catch {
      return 'cancelled';
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    return 'failed';
  }
}
