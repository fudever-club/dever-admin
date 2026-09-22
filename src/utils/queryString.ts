export const createQueryString = (
  name: string,
  value: string,
  extra?: Record<string, string>
) => {
  const params = new URLSearchParams(window?.location?.search);

  value ? params.set(name, value) : params.delete(name);
  if (extra) {
    for (const [key, val] of Object.entries(extra)) {
      val ? params.set(key, val) : params.delete(key);
    }
  }

  return "?" + params.toString();
};
