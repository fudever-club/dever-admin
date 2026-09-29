// TODO(i18n): fallbackLng hiện giữ "en" theo scope P1; cân nhắc chuyển sang "vi"
// khi toàn bộ namespace admin đã có bản vi đầy đủ và đã kiểm thử chuyển ngữ.
export const fallbackLng = "en";
export const languages = [fallbackLng, "vi"];
export const defaultNS = "translation";
export const cookieName = "i18next";

export function getOptions(
  lng = fallbackLng,
  ns: string | string[] = defaultNS
) {
  return {
    // debug: true,
    supportedLngs: languages,
    fallbackLng,
    lng,
    fallbackNS: defaultNS,
    defaultNS,
    ns,
  };
}
