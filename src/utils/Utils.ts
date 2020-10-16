export namespace Utils {
  export function getFileNameFromPath(path: string): string {
    let fileName: string;
    fileName = path.substring(
      path.lastIndexOf(slashType) + 1,
      path.lastIndexOf('.'),
    );

    return fileName;
  }

  let winos: number = navigator.appVersion.indexOf('Win');
  export let slashType = winos !== -1 ? '\\' : '/';
}

export function numDaysBetween(d1: Date, d2: Date): number {
  let diff = Math.abs(d1.getTime() - d2.getTime());
  return diff / (1000 * 60 * 60 * 24);
}
