/**
 * İki değerin (nesne, dizi, ilkel) derin eşitliğini kontrol eder. (lodash bağımlılığı olmadan)
 * @param a Karşılaştırılacak ilk değer
 * @param b Karşılaştırılacak ikinci değer
 * @returns Derin eşitse true, değilse false
 */
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true; // Referans veya ilkel eşitlik
  if (typeof a !== typeof b) return false; // Tipler farklıysa eşit değil
  if (typeof a !== 'object' || a === null || b === null) return false; // Biri null veya obje değilse eşit değil
  if (Array.isArray(a) !== Array.isArray(b)) return false; // Biri dizi diğeri değilse eşit değil
  if (Array.isArray(a)) {
    // İkisi de dizi ise
    if (a.length !== b.length) return false; // Uzunluklar farklıysa eşit değil
    for (let i = 0; i < a.length; i++) {
      // Her elemanı sırayla karşılaştır
      if (!deepEqual(a[i], b[i])) return false; // Herhangi biri eşit değilse false
    }
    return true; // Tüm elemanlar eşitse true
  }
  const aKeys = Object.keys(a); // a'nın anahtarları
  const bKeys = Object.keys(b); // b'nin anahtarları
  if (aKeys.length !== bKeys.length) return false; // Anahtar sayısı farklıysa eşit değil
  for (const key of aKeys) {
    // Her anahtar için
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false; // b'de anahtar yoksa eşit değil
    if (!deepEqual(a[key], b[key])) return false; // Değerler eşit değilse false
  }
  return true; // Tüm anahtarlar ve değerler eşitse true
}
