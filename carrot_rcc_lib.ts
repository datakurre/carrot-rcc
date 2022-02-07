import { TypedValue } from "camunda-external-task-client-js";

export const offsetToString = (offset: number): string => {
  const base =
    (Math.floor(Math.abs(offset) / 60) * 100 + (Math.abs(offset) % 60)) *
    (offset > 0 ? -1 : 1);
  if (base >= 1000) {
    return `+${base}`;
  } else if (base >= 100) {
    return `+0${base}`;
  } else if (base >= 10) {
    return `+00${base}`;
  } else if (base >= 1) {
    return `+000${base}`;
  } else if (base < 0 && base <= -1000) {
    return `-${Math.abs(base)}`;
  } else if (base < 0 && base <= -100) {
    return `-0${Math.abs(base)}`;
  } else if (base < 0 && base <= -10) {
    return `-00${Math.abs(base)}`;
  } else if (base < 0 && base <= -1) {
    return `-000${Math.abs(base)}`;
  } else {
    return "+0000";
  }
};

export const TZ: string = ((): string => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return offsetToString(offset);
})();

export const isEqual = async (
  old: TypedValue | undefined,
  current: any
): Promise<boolean> => {
  if (old === undefined) {
    return false;
  }
  switch (await inferType(old, current)) {
    case "File":
      return false;
    case "Date":
      return new Date(old.value).getTime() === new Date(current).getTime();
    default:
      return old.value === current;
  }
};

export const inferType = async (
  old: TypedValue | undefined,
  current: any
): Promise<string> => {
  if (old?.type === "object") {
    // We can only save deserialized objects back as JSON
    return "Json";
  } else if (old?.type) {
    return old.type[0].toUpperCase() + old.type.substr(1);
  } else if (typeof current === "boolean") {
    return "Boolean";
  } else if (typeof current === "string") {
    if (current.match(/^\d{4}-\d{2}-\d{2}T?[0-9:.Z]*$/)) {
      return "Date";
    } else {
      return "String";
    }
  } else if (typeof current?.getMonth === "function") {
    return "Date";
  } else if (typeof current === "number") {
    if (!`${current}`.match(/\./)) {
      return "Integer";
    } else {
      return "Double";
    }
  }
  return "Json";
};
