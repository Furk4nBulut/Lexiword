/**
 * PageContentFlowPlugin
 *
 * Eğer bir sayfa taşarsa (overflow), fazla içeriği otomatik olarak yeni sayfaya aktarır.
 * Bu plugin, PageAutoSplitPlugin ile birlikte çalışacak şekilde tasarlanmıştır.
 */
// PageContentFlowPlugin'i devre dışı bırakıyoruz. Artık içerik taşımayı ve yeni sayfa eklemeyi sadece PageAutoSplitPlugin yönetecek.
const PageContentFlowPlugin: React.FC = () => {
  if (typeof window !== 'undefined') {
  // debug log kaldırıldı
  }
  return null;
};

export default PageContentFlowPlugin;
