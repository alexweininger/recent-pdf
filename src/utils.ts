export function isOnlinePDF(url: string): boolean {
  const isPDF = url.endsWith('.pdf') || url.endsWith('.PDF');
  const isLocalFile = url.startsWith('file:');
  return !isLocalFile && isPDF;
}