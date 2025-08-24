/**
 * PageContentFlowPlugin
 *
 * (Türkçe) Bu plugin, sayfa taşması durumunda içeriği otomatik olarak
 * yeni sayfaya aktarmak için tasarlanmıştır. Projede bu işlevsellik
 * artık `PageAutoSplitPlugin` tarafından yürütüldüğü için bu plugin
 * minimal bir kapatma (no-op) sağlar; yine de ileride farklı bir
 * akış mantığı eklenirse buradan genişletilebilir.
 */
// PageContentFlowPlugin devre dışı bırakıldı; PageAutoSplitPlugin sorumludur.
const PageContentFlowPlugin: React.FC = () => {
  if (typeof window !== 'undefined') {
    // placeholder - gerekirse debug log eklenebilir
  }
  return null;
};

export default PageContentFlowPlugin;
