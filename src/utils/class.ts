type ClassValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ClassDictionary
  | ClassArray;
type ClassDictionary = Record<string, unknown>;
type ClassArray = ClassValue[];

export function cx(...args: ClassValue[]): string {
  const classes: string[] = [];
  const append = (value: ClassValue): void => {
    if (!value) return;
    if (typeof value === "string" || typeof value === "number") {
      classes.push(String(value));
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) append(item);
      return;
    }
    if (typeof value === "object") {
      for (const [className, condition] of Object.entries(value)) {
        if (condition) classes.push(className);
      }
    }
  };
  for (const arg of args) append(arg);
  return classes.join(" ");
}
