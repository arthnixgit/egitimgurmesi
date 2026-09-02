export function FreeMaterialsState({
  title,
  message
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="ega-highlight-card">
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  );
}

export const FREE_MATERIALS_UNAVAILABLE_MESSAGE =
  "Ücretsiz materyaller şu anda yüklenemiyor. Lütfen kısa süre sonra tekrar deneyin.";

export const FREE_MATERIALS_EMPTY_MESSAGE =
  "Ücretsiz materyaller hazırlanıyor. Yeni içerikler yakında burada yayınlanacak.";

export const FREE_MATERIALS_EMPTY_CATEGORY_MESSAGE =
  "Bu kategoride şu anda yayında materyal bulunmuyor.";
