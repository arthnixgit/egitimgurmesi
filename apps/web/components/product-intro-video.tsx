import type { PackageProduct } from "../lib/package-catalog";
import { isDirectVideoUrl, normalizeVideoEmbedUrl } from "../lib/media-url";

type ProductIntroVideoProps = {
  product: Pick<
    PackageProduct,
    "title" | "introVideoSourceType" | "introVideoUrl" | "introVideoPosterUrl" | "introVideoTitle"
  >;
  variant?: "card" | "detail";
};

export function ProductIntroVideo({ product, variant = "card" }: ProductIntroVideoProps) {
  const videoUrl = product.introVideoUrl?.trim();
  const normalizedVideoUrl = videoUrl ? normalizeVideoEmbedUrl(videoUrl) : "";
  const title = product.introVideoTitle?.trim() || `${product.title} tanıtım videosu`;
  const posterUrl = product.introVideoPosterUrl?.trim();
  const shellClassName =
    variant === "detail"
      ? "ega-product-video ega-product-video--detail"
      : "ega-product-video ega-product-video--card";

  if (!videoUrl) {
    return (
      <div className={shellClassName} data-has-video="false">
        <div className="ega-product-video__placeholder">
          <span className="ega-product-video__eyebrow">Video</span>
          <strong>{title}</strong>
        </div>
      </div>
    );
  }

  if (product.introVideoSourceType === "DIRECT" || isDirectVideoUrl(normalizedVideoUrl)) {
    return (
      <div className={shellClassName} data-has-video="true">
        <video
          className="ega-product-video__media"
          controls
          preload="metadata"
          playsInline
          poster={posterUrl || undefined}
          aria-label={title}
        >
          <source src={normalizedVideoUrl} />
          Tarayıcınız bu videoyu oynatamıyor.
        </video>
      </div>
    );
  }

  return (
    <div className={shellClassName} data-has-video="true">
      <iframe
        className="ega-product-video__media"
        src={normalizedVideoUrl}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
