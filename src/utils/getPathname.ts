// /vi/user-management/2/schedule/
// -> /user-management/2/schedule/
export const getPathname = (pathname: string) => {
  return pathname.split("/").slice(2)?.join("/");
};

export const getLocalizedPath = (pathname: string, locale: string, search = "", hash = "") =>
  `/${locale}/${getPathname(pathname)}${search}${hash}`;

// /vi/user-management/2/schedule/
// -> /user-management
export const getRootPathname = (pathname: string) => {
  return pathname.split("/")?.[2];
};
