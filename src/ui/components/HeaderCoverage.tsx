import { useI18n } from "../../app/i18n";

/** Always visible, including cards without device captions. Coverage is partial
 * even when the document and MAIN-world API hooks have both reported ready.
 */
export function HeaderCoverage({ enabled, identity, report }: {
  enabled: boolean;
  identity: boolean;
  report: { document: boolean; api: boolean; scriptNavigation: boolean; requestBodyPassthrough: boolean } | null;
}) {
  const { t } = useI18n();
  return <details data-header-coverage className="relative z-20 mx-auto max-w-full shrink-0 px-2 text-[11px] text-muted">
    <summary className="cursor-pointer rounded px-1 py-1 focus-visible:outline-accent">
      {enabled ? t("headersPartial") : t("headersBrowser")}
    </summary>
    <div className="absolute bottom-full left-1/2 mb-1 w-72 max-w-[85vw] -translate-x-1/2 rounded-lg border border-line bg-surface p-3 text-start text-xs leading-relaxed text-ink shadow-lg">
      <p>{t("headersSession")}</p>
      <p className="mt-2">{!identity ? t("headersNoIdentity") : !enabled ? t("headersUnavailable") : report?.document ? t("headersDocumentTagged") : t("headersDocumentUnverified")}</p>
      <p>{enabled && report?.api ? t("headersApiTagged") : t("headersApiUnverified")}</p>
      <p>{enabled && report?.scriptNavigation ? t("headersNavigationTagged") : t("headersNavigationUnverified")}</p>
      {report?.requestBodyPassthrough && <p className="text-warn">{t("headersRequestBody")}</p>}
      <p className="mt-2 text-muted">{t("headersLimitations")}</p>
    </div>
  </details>;
}
