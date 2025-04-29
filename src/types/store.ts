export type StoreSet<T extends object> = (
  partial: T | Partial<T> | ((state: T) => T | Partial<T>),
  replace?: false
) => void;

export type StoreGet<T extends object> = () => T;
