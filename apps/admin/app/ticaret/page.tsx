"use client";

import Link from "next/link";
import { PackageCard, type PackageCardProduct } from "@ega/ui";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  clearStaffTokens,
  fetchBootstrapStatus,
  fetchCurrentStaffUser,
  fetchStaffOverview,
  getAdminRequestErrorMessage,
  isStaffSessionError,
  logoutStaff
} from "../../lib/auth-client";
import {
  createAdminCategory,
  createAdminProduct,
  deleteAdminCategory,
  deleteAdminProduct,
  fetchAdminCategories,
  fetchAdminOrder,
  fetchAdminOrders,
  fetchAdminProduct,
  fetchAdminProducts,
  recordAdminOrderManualReview,
  type AdminCatalogCategory,
  type AdminCatalogFeature,
  type AdminCatalogProduct,
  type AdminCatalogVariant,
  type AdminOrderDetail,
  type AdminOrderSummary,
  type SaveAdminCatalogCategoryPayload,
  type SaveAdminCatalogProductPayload,
  updateAdminCategory,
  updateAdminOrderNote,
  updateAdminOrderStatus,
  updateAdminProduct
} from "../../lib/commerce-client";
import {
  buildCategoryTree,
  buildPackageCardPreviewProduct,
  canManageGlobalCatalog,
  canReadCommerceOrders,
  getAvailableCommerceTabs,
  getCanonicalCategoryHref,
  getCardContentWarnings,
  getDefaultCommerceTab,
  getProductCategoryPath,
  getPublishReadiness,
  getPublicSubcategoryFilterId,
  getRootCategories,
  getRootForCategory,
  getSubcategoriesForRoot,
  normalizeCategoryForSave,
  normalizeProductForSave,
  type CategoryTreeNode,
  type ReadinessItem,
  type CommerceTabKey
} from "../../lib/commerce-catalog-ui";
import {
  createExternalMedia,
  fetchAdminMedia,
  uploadAdminMedia,
  type AdminMediaAsset,
  type AdminMediaKind
} from "../../lib/media-client";

type StaffMeResponse = Awaited<ReturnType<typeof fetchCurrentStaffUser>>;
type StaffOverviewResponse = Awaited<ReturnType<typeof fetchStaffOverview>>;
type MediaPickerRequest = {
  title: string;
  description?: string;
  kinds: AdminMediaKind[];
  onSelect: (asset: AdminMediaAsset) => void;
};

const tabMeta: Record<
  CommerceTabKey,
  {
    label: string;
    description: string;
  }
> = {
  categories: {
    label: "Kategori Yönetimi",
    description: "Ana kategori ve alt kategori yapısı"
  },
  products: {
    label: "Paket Yönetimi",
    description: "Konum, kart içeriği, fiyat ve yayın akışı"
  },
  orders: {
    label: "Sipariş Yönetimi",
    description: "Sipariş, ödeme, not ve operasyon takibi"
  }
};

const productTypeOptions = [
  "VIDEO_PACKAGE",
  "COACHING_PACKAGE",
  "HYBRID_PACKAGE",
  "DIGITAL_RESOURCE"
] as const;
const providerOptions = ["LOCAL", "UNIKAZAN"] as const;
const publishStatusOptions = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
const currencyOptions = ["TRY", "USD", "EUR"] as const;
const accentOptions = ["blue", "teal", "amber"] as const;
const videoSourceOptions = ["EMBED", "DIRECT"] as const;
const orderStatusOptions = [
  "DRAFT",
  "PENDING_PAYMENT",
  "REDIRECT_PENDING",
  "AWAITING_CONFIRMATION",
  "PAID",
  "FAILED",
  "CANCELLED",
  "REFUNDED"
] as const;
const paymentStatusOptions = [
  "INITIATED",
  "PENDING",
  "AUTHORIZED",
  "PAID",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
  "PARTIALLY_REFUNDED"
] as const;
const externalStatusOptions = [
  "CREATED",
  "REDIRECT_READY",
  "REDIRECTED",
  "RETURNED_SUCCESS",
  "RETURNED_FAILURE",
  "CONFIRMED",
  "FAILED",
  "CANCELLED"
] as const;

const productTypeLabels: Record<string, string> = {
  VIDEO_PACKAGE: "Video Paketi",
  COACHING_PACKAGE: "Koçluk Paketi",
  HYBRID_PACKAGE: "Hibrit Paket",
  DIGITAL_RESOURCE: "Dijital Kaynak"
};

const providerLabels: Record<string, string> = {
  LOCAL: "Eğitim Gurmesi",
  LOCAL_GATEWAY: "PayTR / Yerel Ödeme",
  PAYTR: "PayTR",
  UNIKAZAN: "Unikazan",
  MANUAL: "Manuel"
};

const publishStatusLabels: Record<string, string> = {
  DRAFT: "Taslak",
  PUBLISHED: "Yayında",
  ARCHIVED: "Arşiv"
};

const orderStatusLabels: Record<string, string> = {
  DRAFT: "Taslak",
  PENDING_PAYMENT: "Ödeme Bekliyor",
  REDIRECT_PENDING: "Yönlendirme Bekliyor",
  AWAITING_CONFIRMATION: "Onay Bekliyor",
  PAID: "Ödendi",
  FAILED: "Başarısız",
  CANCELLED: "İptal",
  REFUNDED: "İade"
};

const paymentStatusLabels: Record<string, string> = {
  INITIATED: "Başlatıldı",
  PENDING: "Beklemede",
  AUTHORIZED: "Yetkilendirildi",
  PAID: "Ödendi",
  FAILED: "Başarısız",
  CANCELLED: "İptal",
  REFUNDED: "İade",
  PARTIALLY_REFUNDED: "Kısmi İade"
};

const externalStatusLabels: Record<string, string> = {
  CREATED: "Oluşturuldu",
  REDIRECT_READY: "Yönlendirme Hazır",
  REDIRECTED: "Yönlendirildi",
  RETURNED_SUCCESS: "Başarılı Dönüş",
  RETURNED_FAILURE: "Başarısız Dönüş",
  CONFIRMED: "Onaylandı",
  FAILED: "Başarısız",
  CANCELLED: "İptal"
};

const accentLabels: Record<string, string> = {
  blue: "Mavi",
  teal: "Turkuaz",
  amber: "Amber"
};

const videoSourceLabels: Record<string, string> = {
  EMBED: "Gömülü Bağlantı",
  DIRECT: "Doğrudan Video"
};

const currencyLabels: Record<string, string> = {
  TRY: "Türk Lirası",
  USD: "ABD Doları",
  EUR: "Euro"
};

function labelFrom(map: Record<string, string>, value?: string | null) {
  return value ? map[value] ?? value : "-";
}

export default function AdminCommercePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<CommerceTabKey>("categories");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [staff, setStaff] = useState<StaffMeResponse | null>(null);
  const [overview, setOverview] = useState<StaffOverviewResponse | null>(null);
  const [mediaAssets, setMediaAssets] = useState<AdminMediaAsset[]>([]);
  const [mediaPickerRequest, setMediaPickerRequest] = useState<MediaPickerRequest | null>(null);
  const [mediaPickerLoading, setMediaPickerLoading] = useState(false);
  const [mediaPickerError, setMediaPickerError] = useState("");
  const [categories, setCategories] = useState<AdminCatalogCategory[]>([]);
  const [products, setProducts] = useState<AdminCatalogProduct[]>([]);
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("new");
  const [selectedProductId, setSelectedProductId] = useState("new");
  const [selectedOrderNumber, setSelectedOrderNumber] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderDetail | null>(null);
  const [categoryDraft, setCategoryDraft] = useState<AdminCatalogCategory>(createEmptyCategory());
  const [productDraft, setProductDraft] = useState<AdminCatalogProduct>(createEmptyProduct());
  const [categorySnapshot, setCategorySnapshot] = useState(() => snapshotCategory(createEmptyCategory()));
  const [productSnapshot, setProductSnapshot] = useState(() => snapshotProduct(createEmptyProduct()));
  const [expandedRootSlug, setExpandedRootSlug] = useState("");
  const [productRootFilter, setProductRootFilter] = useState("");
  const [productSubcategoryFilter, setProductSubcategoryFilter] = useState("");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("ALL");
  const [providerFilter, setProviderFilter] = useState("ALL");
  const [orderNoteDraft, setOrderNoteDraft] = useState("");
  const [orderStatusDraft, setOrderStatusDraft] = useState("DRAFT");
  const [paymentStatusDraft, setPaymentStatusDraft] = useState("UNCHANGED");
  const [externalStatusDraft, setExternalStatusDraft] = useState("UNCHANGED");
  const [manualReviewDraft, setManualReviewDraft] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      setSuccess("");

      try {
        const bootstrap = await fetchBootstrapStatus();

        if (!active) {
          return;
        }

        if (bootstrap.requiresBootstrap) {
          router.replace("/kurulum");
          return;
        }

        const [staffResponse, overviewResponse] = await Promise.all([
          fetchCurrentStaffUser(),
          fetchStaffOverview()
        ]);

        if (!active) {
          return;
        }

        const canManageCatalog = canManageGlobalCatalog(overviewResponse);
        const canReadOrders = canReadCommerceOrders(overviewResponse);
        const [categoriesResponse, productsResponse, ordersResponse] = await Promise.all([
          canManageCatalog ? fetchAdminCategories() : Promise.resolve([]),
          canManageCatalog ? fetchAdminProducts() : Promise.resolve([]),
          canReadOrders ? fetchAdminOrders() : Promise.resolve([])
        ]);
        const defaultTab = getDefaultCommerceTab(overviewResponse);

        if (!active) {
          return;
        }

        setStaff(staffResponse);
        setOverview(overviewResponse);
        setCategories(categoriesResponse);
        setProducts(productsResponse);
        setOrders(ordersResponse);
        setActiveTab((current) =>
          getAvailableCommerceTabs(overviewResponse).includes(current)
            ? current
            : defaultTab ?? "orders"
        );

        const categoryTree = buildCategoryTree(categoriesResponse, productsResponse);
        const firstRoot = categoryTree[0]?.category ?? categoriesResponse[0] ?? null;

        if (firstRoot) {
          const nextCategory = cloneCategory(firstRoot);
          setSelectedCategoryId(firstRoot.id ?? "new");
          setExpandedRootSlug(firstRoot.slug);
          setCategoryDraft(nextCategory);
          setCategorySnapshot(snapshotCategory(nextCategory));
        }

        if (productsResponse[0]) {
          const nextProduct = cloneProduct(productsResponse[0]);
          const root = getRootForCategory(categoriesResponse, nextProduct.categorySlug);
          setSelectedProductId(productsResponse[0].id ?? "new");
          setProductDraft(nextProduct);
          setProductSnapshot(snapshotProduct(nextProduct));
          setProductRootFilter(root?.slug ?? "");
          setProductSubcategoryFilter(nextProduct.categorySlug ?? "");
        }

        if (canReadOrders && ordersResponse[0]) {
          const detail = await fetchAdminOrder(ordersResponse[0].orderNumber);
          setSelectedOrderNumber(detail.orderNumber);
          setSelectedOrder(detail);
          syncOrderDrafts(detail);
        }
      } catch (requestError) {
        if (!active) {
          return;
        }

        if (isStaffSessionError(requestError)) {
          clearStaffTokens();
          router.replace("/giris");
          return;
        }

        setError(
          getAdminRequestErrorMessage(requestError, {
            forbidden: "Ticaret yönetimi için yetkiniz bulunmuyor.",
            server: "Ticaret servisine ulaşılamadı.",
            fallback: "Ticaret yönetimi verileri yüklenemedi."
          })
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [router]);

  const commerceStats = useMemo(
    () => ({
      categoryCount: categories.length,
      rootCategoryCount: categories.filter((entry) => !entry.parentSlug).length,
      productCount: products.length,
      variantCount: products.reduce((total, product) => total + product.variants.length, 0),
      redirectProductCount: products.filter((product) => product.provider === "UNIKAZAN").length,
      orderCount: orders.length
    }),
    [categories, products, orders]
  );

  const accessSource = overview ?? staff?.staffUser ?? null;
  const canManageCatalog = canManageGlobalCatalog(accessSource);
  const canReadOrders = canReadCommerceOrders(accessSource);
  const availableTabs = useMemo(() => getAvailableCommerceTabs(accessSource), [accessSource]);
  const categoryTree = useMemo(() => buildCategoryTree(categories, products), [categories, products]);
  const rootCategoryOptions = useMemo(() => getRootCategories(categories), [categories]);
  const selectedRootNode = useMemo(
    () => categoryTree.find((node) => node.category.slug === expandedRootSlug) ?? categoryTree[0] ?? null,
    [categoryTree, expandedRootSlug]
  );
  const isCategoryDirty = useMemo(
    () => snapshotCategory(categoryDraft) !== categorySnapshot,
    [categoryDraft, categorySnapshot]
  );
  const isProductDirty = useMemo(
    () => snapshotProduct(productDraft) !== productSnapshot,
    [productDraft, productSnapshot]
  );
  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const path = getProductCategoryPath(product, categories);

        if (productRootFilter && path.root?.slug !== productRootFilter) {
          return false;
        }

        if (productSubcategoryFilter && path.subcategory?.slug !== productSubcategoryFilter) {
          return false;
        }

        return true;
      }),
    [categories, productRootFilter, productSubcategoryFilter, products]
  );
  const productReadiness = useMemo(
    () => getPublishReadiness(productDraft, categories),
    [categories, productDraft]
  );
  const productContentWarnings = useMemo(
    () => getCardContentWarnings(productDraft),
    [productDraft]
  );
  const previewProduct = useMemo(
    () => buildPackageCardPreviewProduct(productDraft),
    [productDraft]
  );

  useEffect(() => {
    if (!availableTabs.length || availableTabs.includes(activeTab)) {
      return;
    }

    setActiveTab(availableTabs[0]);
  }, [activeTab, availableTabs]);

  useEffect(() => {
    if (!isCategoryDirty && !isProductDirty) {
      return;
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isCategoryDirty, isProductDirty]);

  const filteredOrders = useMemo(() => {
    const search = orderSearch.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !search ||
        order.orderNumber.toLowerCase().includes(search) ||
        order.userEmail.toLowerCase().includes(search) ||
        order.items.some(
          (item) =>
            item.titleSnapshot.toLowerCase().includes(search) ||
            item.productSlug.toLowerCase().includes(search)
        );

      const matchesOrderStatus =
        orderStatusFilter === "ALL" || order.status === orderStatusFilter;
      const matchesPaymentStatus =
        paymentStatusFilter === "ALL" || order.paymentStatus === paymentStatusFilter;
      const matchesProvider =
        providerFilter === "ALL" ||
        order.paymentProvider === providerFilter ||
        order.externalOrders.some((entry) => entry.provider === providerFilter);

      return matchesSearch && matchesOrderStatus && matchesPaymentStatus && matchesProvider;
    });
  }, [orders, orderSearch, orderStatusFilter, paymentStatusFilter, providerFilter]);

  async function handleLogout() {
    await logoutStaff();
    router.push("/giris");
  }

  async function handleReload() {
    router.refresh();
    window.location.reload();
  }

  async function loadMediaAssets() {
    setMediaPickerLoading(true);
    setMediaPickerError("");

    try {
      setMediaAssets(await fetchAdminMedia());
    } catch (requestError) {
      setMediaPickerError(
        requestError instanceof Error ? requestError.message : "Medya kütüphanesi yüklenemedi."
      );
    } finally {
      setMediaPickerLoading(false);
    }
  }

  function openMediaPicker(request: MediaPickerRequest) {
    setMediaPickerRequest(request);
    setMediaPickerError("");

    if (!mediaAssets.length && !mediaPickerLoading) {
      void loadMediaAssets();
    }
  }

  function selectMediaAsset(asset: AdminMediaAsset) {
    mediaPickerRequest?.onSelect(asset);
    setMediaPickerRequest(null);
  }

  function syncOrderDrafts(order: AdminOrderDetail) {
    setOrderNoteDraft(order.note ?? "");
    setOrderStatusDraft(order.status);
    setPaymentStatusDraft("UNCHANGED");
    setExternalStatusDraft("UNCHANGED");
    setManualReviewDraft("");
  }

  function confirmDiscardCatalogChanges(target: "category" | "product" | "tab") {
    const hasDirtyCategory = target !== "category" && isCategoryDirty;
    const hasDirtyProduct = target !== "product" && isProductDirty;
    const hasCurrentDirtyForm =
      target === "category" ? isCategoryDirty : target === "product" ? isProductDirty : hasDirtyCategory || hasDirtyProduct;

    if (!hasCurrentDirtyForm && !hasDirtyCategory && !hasDirtyProduct) {
      return true;
    }

    return window.confirm("Kaydedilmemiş değişiklikler var. Değişiklikleri atmadan devam etmek istiyor musunuz?");
  }

  async function refreshOrders(nextOrderNumber = selectedOrderNumber) {
    const ordersResponse = await fetchAdminOrders();
    setOrders(ordersResponse);

    if (!nextOrderNumber) {
      setSelectedOrder(null);
      return null;
    }

    const detail = await fetchAdminOrder(nextOrderNumber);
    setSelectedOrder(detail);
    setSelectedOrderNumber(detail.orderNumber);
    syncOrderDrafts(detail);
    return detail;
  }

  function openNewCategoryForm() {
    if (!confirmDiscardCatalogChanges("category")) {
      return;
    }

    const nextCategory = createEmptyCategory();
    setSelectedCategoryId("new");
    setCategoryDraft(nextCategory);
    setCategorySnapshot(snapshotCategory(nextCategory));
    setError("");
    setSuccess("");
  }

  function handleSelectCategory(category: AdminCatalogCategory) {
    if (!confirmDiscardCatalogChanges("category")) {
      return;
    }

    const nextCategory = cloneCategory(category);
    setSelectedCategoryId(category.id ?? "new");
    setExpandedRootSlug(category.parentSlug ?? category.slug);
    setCategoryDraft(nextCategory);
    setCategorySnapshot(snapshotCategory(nextCategory));
    setError("");
    setSuccess("");
  }

  function handleSelectRootCategory(category: AdminCatalogCategory) {
    if (!confirmDiscardCatalogChanges("category")) {
      return;
    }

    const nextCategory = cloneCategory(category);
    setSelectedCategoryId(category.id ?? "new");
    setExpandedRootSlug((current) => (current === category.slug ? current : category.slug));
    setCategoryDraft(nextCategory);
    setCategorySnapshot(snapshotCategory(nextCategory));
    setError("");
    setSuccess("");
  }

  function handleSelectTab(tabKey: CommerceTabKey) {
    if (!confirmDiscardCatalogChanges("tab")) {
      return;
    }

    setActiveTab(tabKey);
    setError("");
    setSuccess("");
  }

  function openNewProductForm(categorySlug: string | null = null) {
    if (!confirmDiscardCatalogChanges("product")) {
      return false;
    }

    const nextProduct = { ...createEmptyProduct(), categorySlug };
    const root = getRootForCategory(categories, categorySlug);
    setSelectedProductId("new");
    setProductDraft(nextProduct);
    setProductSnapshot(snapshotProduct(nextProduct));
    setProductRootFilter(root?.slug ?? "");
    setProductSubcategoryFilter(categorySlug ?? "");
    setError("");
    setSuccess("");
    return true;
  }

  function handleProductRootFilterChange(rootSlug: string) {
    setProductRootFilter(rootSlug);
    setProductSubcategoryFilter("");
  }

  async function handleSelectProduct(productId: string) {
    if (!confirmDiscardCatalogChanges("product")) {
      return;
    }

    setSelectedProductId(productId);
    setError("");
    setSuccess("");
    const full = await fetchAdminProduct(productId);
    const nextProduct = cloneProduct(full);
    const root = getRootForCategory(categories, nextProduct.categorySlug);
    setProductDraft(nextProduct);
    setProductSnapshot(snapshotProduct(nextProduct));
    setProductRootFilter(root?.slug ?? "");
    setProductSubcategoryFilter(nextProduct.categorySlug ?? "");
  }

  async function handleSaveCategory() {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = normalizeCategoryDraft(categoryDraft);
      const saved = payload.id
        ? await updateAdminCategory(payload.id, payload)
        : await createAdminCategory(payload);
      const categoriesResponse = await fetchAdminCategories();
      setCategories(categoriesResponse);
      setSelectedCategoryId(saved.id ?? "new");
      setCategoryDraft(cloneCategory(saved));
      setCategorySnapshot(snapshotCategory(saved));
      setExpandedRootSlug(saved.parentSlug ?? saved.slug);
      setSuccess("Kategori kaydedildi.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Kategori kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCategory() {
    if (!categoryDraft.id) {
      openNewCategoryForm();
      return;
    }

    if (!window.confirm("Bu kategoriyi silmek istediğinize emin misiniz?")) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await deleteAdminCategory(categoryDraft.id);
      const categoriesResponse = await fetchAdminCategories();
      setCategories(categoriesResponse);

      const nextCategory = categoriesResponse[0] ?? null;

      if (nextCategory) {
        setSelectedCategoryId(nextCategory.id ?? "new");
        setCategoryDraft(cloneCategory(nextCategory));
        setCategorySnapshot(snapshotCategory(nextCategory));
        setExpandedRootSlug(nextCategory.parentSlug ?? nextCategory.slug);
      } else {
        const emptyCategory = createEmptyCategory();
        setSelectedCategoryId("new");
        setCategoryDraft(emptyCategory);
        setCategorySnapshot(snapshotCategory(emptyCategory));
      }

      setSuccess("Kategori silindi.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Kategori silinemedi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveProduct(nextPublishStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED" = "DRAFT") {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = normalizeProductDraft({
        ...productDraft,
        publishStatus: nextPublishStatus
      });
      const saved = payload.id
        ? await updateAdminProduct(payload.id, payload)
        : await createAdminProduct(payload);
      const productsResponse = await fetchAdminProducts();
      const savedRoot = getRootForCategory(categories, saved.categorySlug);
      setProducts(productsResponse);
      setSelectedProductId(saved.id ?? "new");
      setProductDraft(cloneProduct(saved));
      setProductSnapshot(snapshotProduct(saved));
      setProductRootFilter(savedRoot?.slug ?? "");
      setProductSubcategoryFilter(saved.categorySlug ?? "");
      setSuccess(
        nextPublishStatus === "PUBLISHED"
          ? "Paket yayına alındı."
          : nextPublishStatus === "ARCHIVED"
            ? "Paket arşivlendi."
            : "Taslak kaydedildi."
      );
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Ürün kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProduct() {
    if (!productDraft.id) {
      openNewProductForm();
      return;
    }

    const confirmation = window.prompt(
      `Bu paketi kalıcı olarak silmek için SİL yazın. Paket: ${productDraft.name || productDraft.slug}`
    );

    if (confirmation !== "SİL") {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await deleteAdminProduct(productDraft.id);
      const productsResponse = await fetchAdminProducts();
      setProducts(productsResponse);

      const nextProduct = productsResponse[0] ?? null;

      if (nextProduct) {
        const nextRoot = getRootForCategory(categories, nextProduct.categorySlug);
        setSelectedProductId(nextProduct.id ?? "new");
        setProductDraft(cloneProduct(nextProduct));
        setProductSnapshot(snapshotProduct(nextProduct));
        setProductRootFilter(nextRoot?.slug ?? "");
        setProductSubcategoryFilter(nextProduct.categorySlug ?? "");
      } else {
        const emptyProduct = createEmptyProduct();
        setSelectedProductId("new");
        setProductDraft(emptyProduct);
        setProductSnapshot(snapshotProduct(emptyProduct));
        setProductRootFilter("");
        setProductSubcategoryFilter("");
      }

      setSuccess("Ürün silindi.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Ürün silinemedi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSelectOrder(orderNumber: string) {
    setSelectedOrderNumber(orderNumber);
    setOrderLoading(true);
    setError("");
    setSuccess("");

    try {
      const order = await fetchAdminOrder(orderNumber);
      setSelectedOrder(order);
      syncOrderDrafts(order);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Sipariş detayı yüklenemedi."
      );
    } finally {
      setOrderLoading(false);
    }
  }

  async function handleSaveOrderNote() {
    if (!selectedOrderNumber) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await updateAdminOrderNote(selectedOrderNumber, { note: orderNoteDraft });
      await refreshOrders(selectedOrderNumber);
      setSuccess("Sipariş notu güncellendi.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Sipariş notu güncellenemedi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleApplyOrderStatus() {
    if (!selectedOrderNumber) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await updateAdminOrderStatus(selectedOrderNumber, {
        status: orderStatusDraft,
        note: orderNoteDraft,
        paymentStatus: paymentStatusDraft === "UNCHANGED" ? null : paymentStatusDraft,
        externalStatus: externalStatusDraft === "UNCHANGED" ? null : externalStatusDraft
      });
      await refreshOrders(selectedOrderNumber);
      setSuccess("Sipariş durumu güncellendi.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Sipariş durumu güncellenemedi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRecordManualReview() {
    if (!selectedOrderNumber || !manualReviewDraft.trim()) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await recordAdminOrderManualReview(selectedOrderNumber, {
        note: manualReviewDraft
      });
      await refreshOrders(selectedOrderNumber);
      setSuccess("Manuel inceleme notu eklendi.");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Manuel inceleme notu eklenemedi."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="admin-shell">
        <section className="admin-card">
          <span className="admin-badge">Yükleniyor</span>
          <h1>Ticaret yönetimi yükleniyor</h1>
          <div className="admin-message admin-message--success">
            Kategori, ürün ve sipariş verileri okunuyor.
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <div className="admin-topbar">
        <div className="admin-brand">
          <div className="admin-brand__mark">CRM</div>
          <div>
            <strong style={{ display: "block" }}>Ticaret ve Sipariş Merkezi</strong>
            <span style={{ color: "var(--admin-muted)" }}>
              Kategori, ürün, varyant, fiyat ve sipariş operasyonu
            </span>
          </div>
        </div>

        <div className="admin-actions">
          <Link className="admin-button--ghost" href="/">
            Kontrol Merkezi
          </Link>
          <Link className="admin-button--ghost" href="/web-sitesi">
            Web Sitesi Yönetimi
          </Link>
          <Link className="admin-button--ghost" href="/medya">
            Medya Kütüphanesi
          </Link>
          <button className="admin-button--ghost" type="button" onClick={handleReload}>
            Yeniden Yükle
          </button>
          <button className="admin-button" type="button" onClick={handleLogout}>
            Çıkış Yap
          </button>
        </div>
      </div>

      <div className="admin-panel-grid">
        <aside className="admin-card admin-sidebar">
          <span className="admin-badge">Yetki</span>
          <h2 style={{ marginTop: 18 }}>Ticaret Yönetimi</h2>
          <p style={{ color: "var(--admin-muted)", lineHeight: 1.7 }}>
            {canManageCatalog
              ? "Paket kataloğu Super Admin tarafından, sipariş operasyonu yetkili ekipler tarafından yönetilir."
              : "Yetkinize uygun sipariş operasyonu görünümü yüklenir."}
          </p>

          <div className="admin-summary">
            <div className="admin-list__item">
              <strong>
                {staff?.staffUser.firstName} {staff?.staffUser.lastName}
              </strong>
              <div>{staff?.staffUser.email}</div>
            </div>
            <div className="admin-list__item">
              <strong>Rol</strong>
              <div>{staff?.staffUser.roleKeys.join(", ") || "Tanımsız"}</div>
            </div>
            <div className="admin-list__item">
              <strong>Yetkiler</strong>
              <div>{overview?.permissionKeys.length ?? 0} adet</div>
            </div>
          </div>

          <div className="admin-kpi-grid">
            <div className="admin-kpi">
              <strong>{commerceStats.categoryCount}</strong>
              <span>Kategori</span>
            </div>
            <div className="admin-kpi">
              <strong>{commerceStats.rootCategoryCount}</strong>
              <span>Ana kategori</span>
            </div>
            <div className="admin-kpi">
              <strong>{commerceStats.productCount}</strong>
              <span>Ürün</span>
            </div>
            <div className="admin-kpi">
              <strong>{commerceStats.variantCount}</strong>
              <span>Varyant</span>
            </div>
            <div className="admin-kpi">
              <strong>{commerceStats.redirectProductCount}</strong>
              <span>Unikazan ürün</span>
            </div>
            <div className="admin-kpi">
              <strong>{commerceStats.orderCount}</strong>
              <span>Sipariş</span>
            </div>
          </div>

          <div className="admin-tab-list">
            {availableTabs.map((tabKey) => (
              <button
                key={tabKey}
                className={`admin-tab ${activeTab === tabKey ? "admin-tab--active" : ""}`}
                type="button"
                onClick={() => handleSelectTab(tabKey)}
              >
                <strong>{tabMeta[tabKey].label}</strong>
                <span>{tabMeta[tabKey].description}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="admin-card admin-editor-panel">
          {!availableTabs.length ? (
            <div className="admin-message admin-message--error">
              Ticaret yönetimi için yetkiniz bulunmuyor.
            </div>
          ) : null}

          {availableTabs.length ? (
            <>
          <div className="admin-editor-header">
            <div>
              <span className="admin-badge">{tabMeta[activeTab].label}</span>
              <h1>{tabMeta[activeTab].description}</h1>
              <p style={{ color: "var(--admin-muted)", lineHeight: 1.7 }}>
                Paketleri, kategorileri ve sipariş operasyonunu yönetin.
              </p>
            </div>
          </div>

          {error ? <div className="admin-message admin-message--error">{error}</div> : null}
          {success ? <div className="admin-message admin-message--success">{success}</div> : null}
            </>
          ) : null}

          {canManageCatalog && activeTab === "categories" ? (
            <div className="admin-category-layout">
              <CategoryHierarchyPanel
                tree={categoryTree}
                products={products}
                selectedRootSlug={selectedRootNode?.category.slug ?? ""}
                selectedCategoryId={selectedCategoryId}
                onNewRoot={openNewCategoryForm}
                onSelectRoot={handleSelectRootCategory}
                onSelectCategory={handleSelectCategory}
                onViewPackages={(subcategory) => {
                  if (!confirmDiscardCatalogChanges("tab")) {
                    return;
                  }

                  setProductRootFilter(subcategory.parentSlug ?? "");
                  setProductSubcategoryFilter(subcategory.slug);
                  setActiveTab("products");
                  setError("");
                  setSuccess("");
                }}
                onCreateProduct={(subcategory) => {
                  if (openNewProductForm(subcategory.slug)) {
                    setActiveTab("products");
                  }
                }}
                onCreateChild={(parentSlug) => {
                  if (!confirmDiscardCatalogChanges("category")) {
                    return;
                  }

                  const child = createEmptyCategory(parentSlug);
                  setSelectedCategoryId("new");
                  setExpandedRootSlug(parentSlug);
                  setCategoryDraft(child);
                  setCategorySnapshot(snapshotCategory(child));
                }}
              />

              <div className="admin-record-editor">
                <CategoryForm
                  draft={categoryDraft}
                  categories={categories}
                  rootCategoryOptions={rootCategoryOptions}
                  dirty={isCategoryDirty}
                  saving={saving}
                  onChange={setCategoryDraft}
                  onSave={handleSaveCategory}
                  onDelete={handleDeleteCategory}
                />
              </div>
            </div>
          ) : null}

          {canManageCatalog && activeTab === "products" ? (
            <div className="admin-record-grid">
              <div className="admin-record-list">
                <div className="admin-toolbar admin-toolbar--split">
                  <div className="admin-editor-meta">
                    <span className="admin-badge">Paket Listesi</span>
                    <span className="admin-editor-meta__text">Paket kataloğu</span>
                  </div>
                  <button className="admin-button" type="button" onClick={() => openNewProductForm()}>
                    Yeni Paket
                  </button>
                </div>

                <div className="admin-filter-grid">
                  <div className="admin-field">
                    <label htmlFor="productRootFilter">Ana Kategori</label>
                    <select
                      id="productRootFilter"
                      className="admin-input admin-select"
                      value={productRootFilter}
                      onChange={(event) => handleProductRootFilterChange(event.target.value)}
                    >
                      <option value="">Tüm ana kategoriler</option>
                      {rootCategoryOptions.map((category) => (
                        <option key={category.id ?? category.slug} value={category.slug}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-field">
                    <label htmlFor="productSubcategoryFilter">Alt Kategori</label>
                    <select
                      id="productSubcategoryFilter"
                      className="admin-input admin-select"
                      value={productSubcategoryFilter}
                      onChange={(event) => setProductSubcategoryFilter(event.target.value)}
                      disabled={!productRootFilter}
                    >
                      <option value="">Tüm alt kategoriler</option>
                      {getSubcategoriesForRoot(categories, productRootFilter, true).map((category) => (
                        <option key={category.id ?? category.slug} value={category.slug}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="admin-record-list__items">
                  {filteredProducts.map((product) => {
                    const path = getProductCategoryPath(product, categories);

                    return (
                      <button
                        key={product.id ?? product.slug}
                        className={`admin-record-item ${
                          selectedProductId === (product.id ?? "new")
                            ? "admin-record-item--active"
                            : ""
                        }`}
                        type="button"
                        onClick={() => void handleSelectProduct(product.id ?? "")}
                      >
                        <div className="admin-record-item__top">
                          <strong>{product.name}</strong>
                          <span className="admin-order-pill">{labelFrom(providerLabels, product.provider)}</span>
                        </div>
                        <div className="admin-record-item__meta">
                          <span>{path.label}</span>
                          <span>{labelFrom(publishStatusLabels, product.publishStatus)}</span>
                        </div>
                        {path.hasMissingSubcategory ? (
                          <div className="admin-warning-line">Alt kategori ataması eksik</div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="admin-record-editor">
                <ProductForm
                  draft={productDraft}
                  categories={categories}
                  dirty={isProductDirty}
                  readiness={productReadiness}
                  contentWarnings={productContentWarnings}
                  previewProduct={previewProduct}
                  previewMode={previewMode}
                  saving={saving}
                  onPreviewModeChange={setPreviewMode}
                  onChange={setProductDraft}
                  onSave={handleSaveProduct}
                  onDelete={handleDeleteProduct}
                  onOpenMediaPicker={openMediaPicker}
                />
              </div>
            </div>
          ) : null}

          {canReadOrders && activeTab === "orders" ? (
            <div className="admin-orders-grid">
              <div className="admin-orders-list">
                <div className="admin-editor-meta">
                  <span className="admin-badge">Siparişler</span>
                  <span className="admin-editor-meta__text">Sipariş takibi</span>
                </div>

                <div className="admin-filter-grid">
                  <div className="admin-field">
                    <label>Arama</label>
                    <input
                      className="admin-input"
                      value={orderSearch}
                      onChange={(event) => setOrderSearch(event.target.value)}
                      placeholder="Sipariş no, e-posta veya ürün"
                    />
                  </div>
                  <div className="admin-field">
                    <label>Sipariş Durumu</label>
                    <select
                      className="admin-input admin-select"
                      value={orderStatusFilter}
                      onChange={(event) => setOrderStatusFilter(event.target.value)}
                    >
                      <option value="ALL">Hepsi</option>
                      {orderStatusOptions.map((option) => (
                        <option key={option} value={option}>
                          {labelFrom(orderStatusLabels, option)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-field">
                    <label>Ödeme Durumu</label>
                    <select
                      className="admin-input admin-select"
                      value={paymentStatusFilter}
                      onChange={(event) => setPaymentStatusFilter(event.target.value)}
                    >
                      <option value="ALL">Hepsi</option>
                      {paymentStatusOptions.map((option) => (
                        <option key={option} value={option}>
                          {labelFrom(paymentStatusLabels, option)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-field">
                    <label>Sağlayıcı</label>
                    <select
                      className="admin-input admin-select"
                      value={providerFilter}
                      onChange={(event) => setProviderFilter(event.target.value)}
                    >
                      <option value="ALL">Hepsi</option>
                      <option value="LOCAL_GATEWAY">{labelFrom(providerLabels, "LOCAL_GATEWAY")}</option>
                      <option value="UNIKAZAN">{labelFrom(providerLabels, "UNIKAZAN")}</option>
                      <option value="MANUAL">{labelFrom(providerLabels, "MANUAL")}</option>
                    </select>
                  </div>
                </div>

                {filteredOrders.length ? (
                  <div className="admin-orders-list__items">
                    {filteredOrders.map((order) => (
                      <button
                        key={order.orderNumber}
                        className={`admin-order-item ${
                          selectedOrderNumber === order.orderNumber ? "admin-order-item--active" : ""
                        }`}
                        type="button"
                        onClick={() => void handleSelectOrder(order.orderNumber)}
                      >
                        <div className="admin-order-item__top">
                          <strong>{order.orderNumber}</strong>
                          <span className="admin-order-pill">{labelFrom(orderStatusLabels, order.status)}</span>
                        </div>
                        <div className="admin-order-item__meta">
                          <span>{order.userEmail}</span>
                          <span>
                            {order.totalAmount} {order.currency}
                          </span>
                        </div>
                        <div className="admin-order-item__meta">
                          <span>{labelFrom(paymentStatusLabels, order.paymentStatus)}</span>
                          <span>{formatDateTime(order.createdAt)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="admin-message admin-message--success">
                    Bu filtrelerle eşleşen sipariş bulunamadı.
                  </div>
                )}
              </div>

              <div className="admin-orders-detail">
                <div className="admin-editor-meta">
                  <span className="admin-badge">Sipariş Operasyonu</span>
                  <span className="admin-editor-meta__text">
                    Not, durum, manuel inceleme ve zaman çizelgesi
                  </span>
                </div>

                {orderLoading ? (
                  <div className="admin-message admin-message--success">Sipariş detayı yükleniyor...</div>
                ) : selectedOrder ? (
                  <OrderManagementPanel
                    order={selectedOrder}
                    saving={saving}
                    orderNoteDraft={orderNoteDraft}
                    orderStatusDraft={orderStatusDraft}
                    paymentStatusDraft={paymentStatusDraft}
                    externalStatusDraft={externalStatusDraft}
                    manualReviewDraft={manualReviewDraft}
                    onOrderNoteChange={setOrderNoteDraft}
                    onOrderStatusChange={setOrderStatusDraft}
                    onPaymentStatusChange={setPaymentStatusDraft}
                    onExternalStatusChange={setExternalStatusDraft}
                    onManualReviewChange={setManualReviewDraft}
                    onSaveNote={() => void handleSaveOrderNote()}
                    onApplyStatus={() => void handleApplyOrderStatus()}
                    onRecordManualReview={() => void handleRecordManualReview()}
                  />
                ) : (
                  <div className="admin-message admin-message--success">
                    İncelemek için bir sipariş seçin.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </section>
      </div>

      {mediaPickerRequest ? (
        <MediaPickerModal
          request={mediaPickerRequest}
          assets={mediaAssets}
          loading={mediaPickerLoading}
          error={mediaPickerError}
          onClose={() => setMediaPickerRequest(null)}
          onReload={() => void loadMediaAssets()}
          onSelect={selectMediaAsset}
        />
      ) : null}
    </main>
  );
}

function MediaUrlField({
  label,
  value,
  kinds,
  pickerTitle,
  placeholder,
  onChange,
  onSelectAsset,
  onOpenMediaPicker
}: {
  label: string;
  value: string;
  kinds: AdminMediaKind[];
  pickerTitle: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onSelectAsset?: (asset: AdminMediaAsset) => void;
  onOpenMediaPicker: (request: MediaPickerRequest) => void;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <div className="admin-media-url-field">
        <input
          className="admin-input"
          type="text"
          value={value}
          placeholder={placeholder ?? "Medya URL'si"}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          className="admin-button--ghost admin-button--compact"
          type="button"
          onClick={() =>
            onOpenMediaPicker({
              title: pickerTitle,
              description: `${kinds.join(", ")} türündeki medya kayıtları listelenir.`,
              kinds,
              onSelect: (asset) => {
                if (onSelectAsset) {
                  onSelectAsset(asset);
                  return;
                }

                onChange(getMediaAssetUsableUrl(asset));
              }
            })
          }
        >
          Medyadan Seç
        </button>
      </div>
    </label>
  );
}

function MediaPickerModal({
  request,
  assets,
  loading,
  error,
  onClose,
  onReload,
  onSelect
}: {
  request: MediaPickerRequest;
  assets: AdminMediaAsset[];
  loading: boolean;
  error: string;
  onClose: () => void;
  onReload: () => void;
  onSelect: (asset: AdminMediaAsset) => void;
}) {
  const filteredAssets = assets.filter((asset) => request.kinds.includes(asset.kind));

  return (
    <div className="admin-media-picker" role="dialog" aria-modal="true" aria-label={request.title}>
      <button className="admin-media-picker__backdrop" type="button" aria-label="Kapat" onClick={onClose} />

      <section className="admin-media-picker__panel">
        <div className="admin-media-picker__head">
          <div>
            <span className="admin-badge">Medya Kütüphanesi</span>
            <h2>{request.title}</h2>
            <p>{request.description ?? "Uygun medya kaydını seçin."}</p>
          </div>

          <div className="admin-actions">
            <button className="admin-button--ghost" type="button" onClick={onReload} disabled={loading}>
              {loading ? "Yükleniyor..." : "Yenile"}
            </button>
            <Link className="admin-button--ghost" href="/medya" target="_blank">
              Medya Ekle
            </Link>
            <button className="admin-button" type="button" onClick={onClose}>
              Kapat
            </button>
          </div>
        </div>

        {error ? <div className="admin-message admin-message--error">{error}</div> : null}
        {loading ? <div className="admin-message admin-message--success">Medya kayıtları yükleniyor.</div> : null}

        {!loading && filteredAssets.length === 0 ? (
          <div className="admin-empty-state">
            Uygun medya bulunamadı. Medya Kütüphanesi’nden yeni kayıt ekleyin.
          </div>
        ) : null}

        <div className="admin-media-picker__grid">
          {filteredAssets.map((asset) => (
            <article key={asset.id} className="admin-media-picker-card">
              <div className="admin-media-picker-card__preview">
                {asset.kind === "IMAGE" || asset.kind === "BRANDING" ? (
                  getMediaAssetUsableUrl(asset) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={getMediaAssetUsableUrl(asset)} alt={asset.altText ?? asset.title} />
                  ) : (
                    <span>{asset.kind}</span>
                  )
                ) : asset.kind === "VIDEO" && asset.embedUrl ? (
                  <iframe src={asset.embedUrl} title={asset.title} loading="lazy" allowFullScreen />
                ) : asset.kind === "VIDEO" && asset.publicUrl ? (
                  <video src={asset.publicUrl} poster={asset.thumbnailUrl ?? undefined} preload="metadata" controls />
                ) : (
                  <span>{asset.kind}</span>
                )}
              </div>

              <div className="admin-media-picker-card__body">
                <strong>{asset.title}</strong>
                <span>
                  {asset.kind} · {asset.sourceType}
                </span>
                <code>{getMediaAssetUsableUrl(asset) || "URL yok"}</code>
              </div>

              <button
                className="admin-button"
                type="button"
                disabled={!getMediaAssetUsableUrl(asset)}
                onClick={() => onSelect(asset)}
              >
                Bu Medyayı Kullan
              </button>
            </article>
          ))}
        </div>
      </section>

    </div>
  );
}

function getMediaAssetUsableUrl(asset: AdminMediaAsset) {
  return asset.url ?? asset.embedUrl ?? asset.publicUrl ?? asset.externalUrl ?? asset.thumbnailUrl ?? "";
}

function CategoryHierarchyPanel({
  tree,
  products,
  selectedRootSlug,
  selectedCategoryId,
  onNewRoot,
  onSelectRoot,
  onSelectCategory,
  onViewPackages,
  onCreateProduct,
  onCreateChild
}: {
  tree: CategoryTreeNode[];
  products: AdminCatalogProduct[];
  selectedRootSlug: string;
  selectedCategoryId: string;
  onNewRoot: () => void;
  onSelectRoot: (category: AdminCatalogCategory) => void;
  onSelectCategory: (category: AdminCatalogCategory) => void;
  onViewPackages: (category: AdminCatalogCategory) => void;
  onCreateProduct: (category: AdminCatalogCategory) => void;
  onCreateChild: (parentSlug: string) => void;
}) {
  const selectedNode = tree.find((node) => node.category.slug === selectedRootSlug) ?? tree[0] ?? null;

  return (
    <div className="admin-category-tree">
      <div className="admin-toolbar admin-toolbar--split">
        <div className="admin-editor-meta">
          <span className="admin-badge">Ana Kategoriler</span>
          <span className="admin-editor-meta__text">Public katalog sırasıyla iki seviyeli yapı</span>
        </div>
        <button className="admin-button" type="button" onClick={onNewRoot}>
          Yeni Ana Kategori
        </button>
      </div>

      <div className="admin-category-root-grid" role="list" aria-label="Ana kategori listesi">
        {tree.map((node) => {
          const category = node.category;
          const isExpanded = selectedNode?.category.slug === category.slug;

          return (
            <article
              key={category.id ?? category.slug}
              className="admin-category-root-card"
              data-active={isExpanded}
              role="listitem"
            >
              <button
                type="button"
                className="admin-category-root-card__button"
                aria-expanded={isExpanded}
                aria-controls={`subcategories-${category.slug}`}
                onClick={() => onSelectRoot(category)}
              >
                <span className="admin-category-root-card__head">
                  <strong>{category.name}</strong>
                  <span
                    className={`admin-status-pill ${
                      category.isActive ? "admin-status-pill--active" : "admin-status-pill--suspended"
                    }`}
                  >
                    {category.isActive ? "Aktif" : "Pasif"}
                  </span>
                </span>
                <span className="admin-category-root-card__description">
                  {category.description || "Açıklama girilmedi."}
                </span>
                <span className="admin-category-root-card__meta">
                  <span>Sıra {category.sortOrder ?? 0}</span>
                  <span>{node.subcategories.length} alt kategori</span>
                  <span>{node.totalProductCount} paket</span>
                </span>
              </button>
              <div className="admin-category-root-card__actions">
                <button className="admin-button--compact" type="button" onClick={() => onSelectCategory(category)}>
                  Düzenle
                </button>
                <button className="admin-button--compact" type="button" onClick={() => onCreateChild(category.slug)}>
                  Alt Kategori Ekle
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {selectedNode ? (
        <section
          id={`subcategories-${selectedNode.category.slug}`}
          className="admin-subpanel admin-category-children"
        >
          <div className="admin-toolbar admin-toolbar--split">
            <div className="admin-editor-meta">
              <span className="admin-badge">{selectedNode.category.name}</span>
              <span className="admin-editor-meta__text">Alt kategoriler ve bağlı paketler</span>
            </div>
            <button
              className="admin-button--ghost"
              type="button"
              onClick={() => onCreateChild(selectedNode.category.slug)}
            >
              Alt Kategori Ekle
            </button>
          </div>

          <div className="admin-category-child-list" role="list" aria-label="Alt kategori listesi">
            {selectedNode.subcategories.length ? (
              selectedNode.subcategories.map((subcategory) => {
                const packageCount = products.filter((product) => product.categorySlug === subcategory.slug).length;

                return (
                  <article
                    key={subcategory.id ?? subcategory.slug}
                    className="admin-category-child-item"
                    data-active={selectedCategoryId === (subcategory.id ?? "new")}
                    role="listitem"
                  >
                    <button
                      className="admin-category-child-item__button"
                      type="button"
                      aria-current={selectedCategoryId === (subcategory.id ?? "new") ? "true" : undefined}
                      onClick={() => onSelectCategory(subcategory)}
                    >
                      <span className="admin-category-child-item__head">
                        <strong>{subcategory.name}</strong>
                        <span
                          className={`admin-status-pill ${
                            subcategory.isActive ? "admin-status-pill--active" : "admin-status-pill--suspended"
                          }`}
                        >
                          {subcategory.isActive ? "Aktif" : "Pasif"}
                        </span>
                      </span>
                      <span className="admin-category-child-item__description">
                        {subcategory.description || "Açıklama girilmedi."}
                      </span>
                      <span className="admin-category-child-item__meta">
                        <span>Sıra {subcategory.sortOrder ?? 0}</span>
                        <span>{packageCount} paket</span>
                      </span>
                    </button>
                    <div className="admin-category-child-item__actions">
                      <button className="admin-button--compact" type="button" onClick={() => onSelectCategory(subcategory)}>
                        Düzenle
                      </button>
                      <button className="admin-button--compact" type="button" onClick={() => onViewPackages(subcategory)}>
                        Paketleri Gör
                      </button>
                      <button className="admin-button--compact" type="button" onClick={() => onCreateProduct(subcategory)}>
                        Yeni Paket Ekle
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="admin-message admin-message--success">
                Bu ana kategori altında henüz alt kategori bulunmuyor.
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function CategoryForm({
  draft,
  categories,
  rootCategoryOptions,
  dirty,
  saving,
  onChange,
  onSave,
  onDelete
}: {
  draft: AdminCatalogCategory;
  categories: AdminCatalogCategory[];
  rootCategoryOptions: AdminCatalogCategory[];
  dirty: boolean;
  saving: boolean;
  onChange: (nextValue: AdminCatalogCategory) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const isChild = Boolean(draft.parentSlug);
  const selectedParent = rootCategoryOptions.find((category) => category.slug === draft.parentSlug) ?? null;
  const canonicalHref = getCanonicalCategoryHref(draft);

  return (
    <div className="admin-form-stack">
      <div className="admin-toolbar admin-toolbar--split">
        <div className="admin-editor-meta">
          <span className="admin-badge">{draft.id ? "Kategori Düzenle" : "Yeni Kategori"}</span>
          <span className="admin-editor-meta__text">
            {isChild ? `${selectedParent?.name ?? "Ana kategori"} altında alt kategori` : "Ana kategori"}
          </span>
          <span className={`admin-save-state ${dirty ? "admin-save-state--dirty" : "admin-save-state--clean"}`}>
            {dirty ? "Kaydedilmemiş" : "Kaydedildi"}
          </span>
        </div>
        <div className="admin-actions">
          {draft.id ? (
            <button className="admin-button--ghost" type="button" onClick={onDelete}>
              Sil
            </button>
          ) : null}
          <button className="admin-button" type="button" disabled={saving} onClick={onSave}>
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>

      <section className="admin-subpanel">
        <div className="admin-editor-meta">
          <span className="admin-badge">Kategori Türü</span>
          <span className="admin-editor-meta__text">
            Public katalog iki seviye kullanır: ana kategori ve alt kategori.
          </span>
        </div>

        <div className="admin-segmented-control" role="group" aria-label="Kategori türü">
          <button
            type="button"
            aria-pressed={!isChild}
            className={!isChild ? "admin-segmented-control__item admin-segmented-control__item--active" : "admin-segmented-control__item"}
            onClick={() => onChange({ ...draft, parentSlug: null })}
          >
            Ana Kategori
          </button>
          <button
            type="button"
            aria-pressed={isChild}
            className={isChild ? "admin-segmented-control__item admin-segmented-control__item--active" : "admin-segmented-control__item"}
            onClick={() =>
              onChange({
                ...draft,
                parentSlug: draft.parentSlug ?? rootCategoryOptions.find((entry) => entry.id !== draft.id)?.slug ?? null
              })
            }
          >
            Alt Kategori
          </button>
        </div>

        {isChild ? (
          <div className="admin-field">
            <label htmlFor="categoryParentSlug">Ana Kategori</label>
            <select
              id="categoryParentSlug"
              className="admin-input admin-select"
              value={draft.parentSlug ?? ""}
              onChange={(event) =>
                onChange({
                  ...draft,
                  parentSlug: event.target.value || null
                })
              }
            >
              <option value="">Ana kategori seç</option>
              {rootCategoryOptions
                .filter((entry) => entry.id !== draft.id)
                .map((entry) => (
                  <option key={entry.id ?? entry.slug} value={entry.slug}>
                    {entry.name}
                  </option>
                ))}
            </select>
            {selectedParent ? (
              <small className="admin-field-help">Seçili ana kategori: {selectedParent.name}</small>
            ) : null}
          </div>
        ) : null}
      </section>

      <div className="admin-form-grid">
        <div className="admin-field">
          <label htmlFor="categoryName">Ad</label>
          <input
            id="categoryName"
            className="admin-input"
            value={draft.name}
            onChange={(event) => onChange({ ...draft, name: event.target.value })}
          />
        </div>
        <div className="admin-field">
          <label htmlFor="categorySlug">Slug</label>
          <input
            id="categorySlug"
            className="admin-input"
            value={draft.slug}
            onChange={(event) => onChange({ ...draft, slug: event.target.value })}
          />
        </div>
        <div className="admin-field">
          <label htmlFor="categorySortOrder">Sıra</label>
          <input
            id="categorySortOrder"
            className="admin-input"
            type="number"
            value={draft.sortOrder ?? 0}
            onChange={(event) =>
              onChange({
                ...draft,
                sortOrder: Number(event.target.value)
              })
            }
          />
        </div>
      </div>

      <div className="admin-field">
        <label htmlFor="categoryDescription">Açıklama</label>
        <textarea
          id="categoryDescription"
          className="admin-input admin-textarea"
          value={draft.description ?? ""}
          onChange={(event) => onChange({ ...draft, description: event.target.value })}
        />
      </div>

      <label className="admin-check admin-check--inline">
        <input
          type="checkbox"
          checked={draft.isActive ?? true}
          onChange={(event) => onChange({ ...draft, isActive: event.target.checked })}
        />
        <span>Aktif kategori olarak yayınla</span>
      </label>

      <section className="admin-subpanel">
        <div className="admin-editor-meta">
          <span className="admin-badge">Public Bağlantı Önizlemesi</span>
          <span className="admin-editor-meta__text">
            {isChild
              ? `Alt filtre: ${getPublicSubcategoryFilterId(draft) || "-"}`
              : "Ana kategori filtresi"}
          </span>
        </div>
        <code className="admin-code-preview">{canonicalHref || "Slug girildiğinde otomatik oluşur."}</code>
      </section>

      <details className="admin-subpanel">
        <summary>Gelişmiş Ayarlar</summary>
        <div className="admin-form-grid">
          <div className="admin-field">
            <label htmlFor="categorySeoTitle">SEO Başlık</label>
            <input
              id="categorySeoTitle"
              className="admin-input"
              value={draft.seoTitle ?? ""}
              onChange={(event) => onChange({ ...draft, seoTitle: event.target.value })}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="categorySeoDescription">SEO Açıklama</label>
            <textarea
              id="categorySeoDescription"
              className="admin-input admin-textarea admin-textarea--compact"
              value={draft.seoDescription ?? ""}
              onChange={(event) => onChange({ ...draft, seoDescription: event.target.value })}
            />
          </div>
        </div>
      </details>

      <details className="admin-subpanel">
        <summary>Gelişmiş Teknik Ayarlar</summary>
        <div className="admin-field">
          <label htmlFor="categoryCtaHref">Raw CTA / Filtre URL</label>
          <input
            id="categoryCtaHref"
            className="admin-input"
            value={draft.ctaHref ?? ""}
            placeholder={canonicalHref}
            onChange={(event) => onChange({ ...draft, ctaHref: event.target.value })}
          />
          <small className="admin-field-help">
            Boş bırakılırsa canonical public filtre bağlantısı otomatik kaydedilir.
          </small>
        </div>
        <div className="admin-field-help">
          Kayıtlı kategori sayısı: {categories.length}
        </div>
      </details>
    </div>
  );
}

function ProductForm({
  draft,
  categories,
  dirty,
  readiness,
  contentWarnings,
  previewProduct,
  previewMode,
  saving,
  onPreviewModeChange,
  onChange,
  onSave,
  onDelete,
  onOpenMediaPicker
}: {
  draft: AdminCatalogProduct;
  categories: AdminCatalogCategory[];
  dirty: boolean;
  readiness: ReadinessItem[];
  contentWarnings: string[];
  previewProduct: PackageCardProduct;
  previewMode: "desktop" | "mobile";
  saving: boolean;
  onPreviewModeChange: (mode: "desktop" | "mobile") => void;
  onChange: (nextValue: AdminCatalogProduct) => void;
  onSave: (nextPublishStatus?: "DRAFT" | "PUBLISHED" | "ARCHIVED") => void;
  onDelete: () => void;
  onOpenMediaPicker: (request: MediaPickerRequest) => void;
}) {
  const canShowExternalMapping = draft.provider === "UNIKAZAN";
  const [mediaBusy, setMediaBusy] = useState(false);
  const rootCategories = getRootCategories(categories);
  const selectedRoot = getRootForCategory(categories, draft.categorySlug);
  const selectedCategory = categories.find((category) => category.slug === draft.categorySlug) ?? null;
  const selectedSubcategorySlug = selectedCategory?.parentSlug ? selectedCategory.slug : "";
  const selectedRootSlug = selectedRoot?.slug ?? "";
  const activeSubcategoryOptions = getSubcategoriesForRoot(categories, selectedRootSlug);
  const subcategoryOptions =
    selectedCategory?.parentSlug === selectedRootSlug &&
    selectedCategory.isActive === false &&
    !activeSubcategoryOptions.some((category) => category.slug === selectedCategory.slug)
      ? [...activeSubcategoryOptions, selectedCategory]
      : activeSubcategoryOptions;
  const categoryPath = getProductCategoryPath(draft, categories);

  function updateVariant(index: number, nextValue: AdminCatalogVariant) {
    onChange({
      ...draft,
      variants: draft.variants.map((entry, entryIndex) => (entryIndex === index ? nextValue : entry))
    });
  }

  function updateFeature(index: number, nextValue: AdminCatalogFeature) {
    onChange({
      ...draft,
      features: draft.features.map((entry, entryIndex) => (entryIndex === index ? nextValue : entry))
    });
  }

  async function handleNormalizeIntroVideoUrl() {
    if (!draft.introVideoUrl?.trim()) {
      window.alert("Önce bir video URL girin.");
      return;
    }

    setMediaBusy(true);

    try {
      const asset = await createExternalMedia({
        kind: "VIDEO",
        title: draft.introVideoTitle?.trim() || `${draft.name} tanıtım videosu`,
        externalUrl: draft.introVideoUrl,
        thumbnailUrl: draft.introVideoPosterUrl ?? undefined
      });

      onChange({
        ...draft,
        introVideoSourceType: asset.playbackSourceType ?? "EMBED",
        introVideoUrl: asset.url ?? asset.embedUrl ?? asset.publicUrl ?? draft.introVideoUrl,
        introVideoPosterUrl: asset.thumbnailUrl ?? draft.introVideoPosterUrl ?? null
      });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Video URL normalize edilemedi.");
    } finally {
      setMediaBusy(false);
    }
  }

  async function handleUploadProductMedia(
    file: File | null,
    field: "coverImageUrl" | "introVideoPosterUrl"
  ) {
    if (!file) {
      return;
    }

    setMediaBusy(true);

    try {
      const asset = await uploadAdminMedia({
        file,
        kind: "IMAGE",
        title: `${draft.name} ${field === "coverImageUrl" ? "kapak" : "video poster"}`
      });
      const assetUrl = asset.url ?? asset.publicUrl ?? "";

      if (!assetUrl) {
        throw new Error("Yüklenen medya için kullanılabilir URL üretilemedi.");
      }

      onChange({
        ...draft,
        [field]: assetUrl
      });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Medya yüklenemedi.");
    } finally {
      setMediaBusy(false);
    }
  }

  return (
    <div className="admin-form-stack">
      <div className="admin-toolbar admin-toolbar--split">
        <div className="admin-editor-meta">
          <span className="admin-badge">{draft.id ? "Paket Düzenle" : "Yeni Paket"}</span>
          <span className="admin-editor-meta__text">
            {categoryPath.label}
          </span>
          <span className={`admin-save-state ${dirty ? "admin-save-state--dirty" : "admin-save-state--clean"}`}>
            {dirty ? "Kaydedilmemiş" : "Kaydedildi"}
          </span>
        </div>
        <div className="admin-actions">
          <button className="admin-button--ghost" type="button" disabled={saving} onClick={() => onSave("DRAFT")}>
            {saving ? "Kaydediliyor..." : "Taslağı Kaydet"}
          </button>
          <a className="admin-button--ghost" href="#admin-card-preview">
            Önizle
          </a>
          <button className="admin-button" type="button" disabled={saving} onClick={() => onSave("PUBLISHED")}>
            {saving ? "Yayınlanıyor..." : "Yayınla"}
          </button>
          {draft.id ? (
            <button className="admin-button--ghost" type="button" disabled={saving} onClick={() => onSave("ARCHIVED")}>
              Arşivle
            </button>
          ) : null}
          {draft.id ? (
            <button className="admin-button--ghost" type="button" disabled={saving} onClick={onDelete}>
              Sil
            </button>
          ) : null}
        </div>
      </div>

      {categoryPath.hasMissingSubcategory ? (
        <div className="admin-message admin-message--error">Alt kategori ataması eksik</div>
      ) : null}

      <section className="admin-subpanel">
        <div className="admin-editor-meta">
          <span className="admin-badge">Step 1 — Konum ve Temel Bilgiler</span>
          <span className="admin-editor-meta__text">Paket public katalogda seçilen alt kategoriye kaydedilir.</span>
        </div>

        <div className="admin-form-grid">
          <div className="admin-field">
            <label htmlFor="productRootCategory">Ana Kategori</label>
            <select
              id="productRootCategory"
              className="admin-input admin-select"
              value={selectedRootSlug}
              onChange={(event) => {
                const nextRootSlug = event.target.value;
                const currentChildStillValid = selectedCategory?.parentSlug === nextRootSlug;
                onChange({
                  ...draft,
                  categorySlug: currentChildStillValid ? selectedCategory?.slug ?? null : null
                });
              }}
            >
              <option value="">Ana kategori seç</option>
              {rootCategories.map((category) => (
                <option key={category.id ?? category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <label htmlFor="productSubcategory">Alt Kategori</label>
            <select
              id="productSubcategory"
              className="admin-input admin-select"
              value={selectedSubcategorySlug}
              onChange={(event) => onChange({ ...draft, categorySlug: event.target.value || null })}
              disabled={!selectedRootSlug}
            >
              <option value="">Alt kategori seç</option>
              {subcategoryOptions.map((category) => (
                <option key={category.id ?? category.slug} value={category.slug}>
                  {category.name}
                  {category.isActive === false ? " (pasif)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <label htmlFor="productName">Paket Adı</label>
            <input
              id="productName"
              className="admin-input"
              value={draft.name}
              onChange={(event) => onChange({ ...draft, name: event.target.value })}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="productSlug">Slug</label>
            <input
              id="productSlug"
              className="admin-input"
              value={draft.slug}
              onChange={(event) => onChange({ ...draft, slug: event.target.value })}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="productType">Paket Türü</label>
            <select
              id="productType"
              className="admin-input admin-select"
              value={draft.type}
              onChange={(event) => onChange({ ...draft, type: event.target.value })}
            >
              {productTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {labelFrom(productTypeLabels, option)}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <label htmlFor="productProvider">Sağlayıcı</label>
            <select
              id="productProvider"
              className="admin-input admin-select"
              value={draft.provider}
              onChange={(event) => onChange({ ...draft, provider: event.target.value })}
            >
              {providerOptions.map((option) => (
                <option key={option} value={option}>
                  {labelFrom(providerLabels, option)}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <label htmlFor="productStatus">Durum</label>
            <select
              id="productStatus"
              className="admin-input admin-select"
              value={draft.publishStatus ?? "DRAFT"}
              onChange={(event) => onChange({ ...draft, publishStatus: event.target.value })}
            >
              {publishStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {labelFrom(publishStatusLabels, option)}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <label htmlFor="productSortOrder">Sıra</label>
            <input
              id="productSortOrder"
              className="admin-input"
              type="number"
              value={draft.sortOrder ?? 0}
              onChange={(event) => onChange({ ...draft, sortOrder: Number(event.target.value) })}
            />
          </div>
        </div>

        <div className="admin-field">
          <label htmlFor="productShortDescription">Kısa Açıklama</label>
          <textarea
            id="productShortDescription"
            className="admin-input admin-textarea admin-textarea--compact"
            value={draft.shortDescription ?? ""}
            onChange={(event) => onChange({ ...draft, shortDescription: event.target.value })}
          />
        </div>
      </section>

      <section className="admin-subpanel">
        <div className="admin-editor-meta">
          <span className="admin-badge">Step 3 — Kart İçeriği</span>
          <span className="admin-editor-meta__text">Mevcut public kart tasarımını besleyen kontrollü alanlar</span>
        </div>

        <div className="admin-form-grid">
          <div className="admin-field">
            <label htmlFor="productAccentColor">Kart Tonu</label>
            <select
              id="productAccentColor"
              className="admin-input admin-select"
              value={draft.accentColor ?? "blue"}
              onChange={(event) => onChange({ ...draft, accentColor: event.target.value })}
            >
              {accentOptions.map((option) => (
                <option key={option} value={option}>
                  {labelFrom(accentLabels, option)}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <MediaUrlField
              label="Kapak Görsel URL"
              value={draft.coverImageUrl ?? ""}
              kinds={["IMAGE", "BRANDING"]}
              pickerTitle={`${draft.name || "Paket"} kapak görseli seç`}
              onChange={(value) => onChange({ ...draft, coverImageUrl: value })}
              onOpenMediaPicker={onOpenMediaPicker}
            />
            <input
              className="admin-input admin-file-input"
              type="file"
              accept="image/*"
              disabled={mediaBusy}
              onChange={(event) =>
                void handleUploadProductMedia(event.target.files?.[0] ?? null, "coverImageUrl")
              }
            />
          </div>
        </div>
      </section>

      <section className="admin-subpanel">
        <div className="admin-editor-meta">
          <span className="admin-badge">Kart Medyası</span>
          <span className="admin-editor-meta__text">Paket tanıtım medyasını yönetin.</span>
        </div>

        <div className="admin-form-grid">
          <div className="admin-field">
            <label>Kaynak Tipi</label>
            <select
              className="admin-input admin-select"
              value={draft.introVideoSourceType ?? "EMBED"}
              onChange={(event) =>
                onChange({
                  ...draft,
                  introVideoSourceType: event.target.value as "EMBED" | "DIRECT"
                })
              }
            >
              {videoSourceOptions.map((option) => (
                <option key={option} value={option}>
                  {labelFrom(videoSourceLabels, option)}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <label>Video Başlığı</label>
            <input
              className="admin-input"
              value={draft.introVideoTitle ?? ""}
              onChange={(event) => onChange({ ...draft, introVideoTitle: event.target.value })}
              placeholder="Video başlığı"
            />
          </div>
        </div>

        <div className="admin-form-grid">
          <div className="admin-field">
            <MediaUrlField
              label="Embed / Video URL"
              value={draft.introVideoUrl ?? ""}
              kinds={["VIDEO"]}
              pickerTitle={`${draft.name || "Ürün"} tanıtım videosu seç`}
              placeholder="Embed veya doğrudan video URL'si"
              onChange={(value) => onChange({ ...draft, introVideoUrl: value })}
              onSelectAsset={(asset) =>
                onChange({
                  ...draft,
                  introVideoUrl: getMediaAssetUsableUrl(asset),
                  introVideoSourceType: asset.playbackSourceType ?? draft.introVideoSourceType ?? "EMBED",
                  introVideoPosterUrl: asset.thumbnailUrl ?? draft.introVideoPosterUrl ?? null
                })
              }
              onOpenMediaPicker={onOpenMediaPicker}
            />
            <button
              className="admin-button--ghost"
              type="button"
              disabled={mediaBusy || !draft.introVideoUrl?.trim()}
              onClick={() => void handleNormalizeIntroVideoUrl()}
            >
              Bağlantıyı Düzenle
            </button>
          </div>
          <div className="admin-field">
            <MediaUrlField
              label="Poster URL"
              value={draft.introVideoPosterUrl ?? ""}
              kinds={["IMAGE", "BRANDING"]}
              pickerTitle={`${draft.name || "Ürün"} video posteri seç`}
              placeholder="Oynatma öncesi kapak görseli"
              onChange={(value) => onChange({ ...draft, introVideoPosterUrl: value })}
              onOpenMediaPicker={onOpenMediaPicker}
            />
            <input
              className="admin-input admin-file-input"
              type="file"
              accept="image/*"
              disabled={mediaBusy}
              onChange={(event) =>
                void handleUploadProductMedia(event.target.files?.[0] ?? null, "introVideoPosterUrl")
              }
            />
          </div>
        </div>
      </section>

      <div className="admin-field">
        <label>Açıklama</label>
        <textarea
          className="admin-input admin-textarea"
          value={draft.description ?? ""}
          onChange={(event) => onChange({ ...draft, description: event.target.value })}
        />
      </div>

      <details className="admin-subpanel">
        <summary>SEO</summary>
        <div className="admin-form-grid">
          <div className="admin-field">
            <label>SEO Başlık</label>
            <input
              className="admin-input"
              value={draft.seoTitle ?? ""}
              onChange={(event) => onChange({ ...draft, seoTitle: event.target.value })}
            />
          </div>
          <div className="admin-field">
            <label>SEO Açıklama</label>
            <textarea
              className="admin-input admin-textarea admin-textarea--compact"
              value={draft.seoDescription ?? ""}
              onChange={(event) => onChange({ ...draft, seoDescription: event.target.value })}
            />
          </div>
        </div>
      </details>

      <label className="admin-check admin-check--inline">
        <input
          type="checkbox"
          checked={draft.isFeatured ?? false}
          onChange={(event) => onChange({ ...draft, isFeatured: event.target.checked })}
        />
        <span>Öne çıkan ürün olarak işaretle</span>
      </label>

      <section className="admin-subpanel">
        <div className="admin-toolbar admin-toolbar--split">
          <div className="admin-editor-meta">
            <span className="admin-badge">Step 2 — Fiyat ve Paket Seçenekleri</span>
            <span className="admin-editor-meta__text">
              Her paket en az bir seçeneğe sahip olmalıdır
            </span>
          </div>
          <button
            className="admin-button--ghost"
            type="button"
            onClick={() => onChange({ ...draft, variants: [...draft.variants, createEmptyVariant()] })}
          >
            Varyant Ekle
          </button>
        </div>

        <div className="admin-stack">
          {draft.variants.map((variant, index) => (
            <div key={variant.id ?? `variant-${index}`} className="admin-nested-card">
              <div className="admin-toolbar admin-toolbar--split">
                <strong>Varyant {index + 1}</strong>
                <button
                  className="admin-button--ghost"
                  type="button"
                  onClick={() =>
                    onChange({
                      ...draft,
                      variants: draft.variants.filter((_, entryIndex) => entryIndex !== index)
                    })
                  }
                >
                  Kaldır
                </button>
              </div>

              <div className="admin-form-grid">
                <div className="admin-field">
                  <label>Başlık</label>
                  <input
                    className="admin-input"
                    value={variant.title}
                    onChange={(event) => updateVariant(index, { ...variant, title: event.target.value })}
                  />
                </div>
                <div className="admin-field">
                  <label>SKU</label>
                  <input
                    className="admin-input"
                    value={variant.sku}
                    onChange={(event) => updateVariant(index, { ...variant, sku: event.target.value })}
                  />
                </div>
                <div className="admin-field">
                  <label>Fiyat Etiketi</label>
                  <input
                    className="admin-input"
                    value={variant.billingLabel ?? ""}
                    onChange={(event) =>
                      updateVariant(index, { ...variant, billingLabel: event.target.value })
                    }
                  />
                </div>
                <div className="admin-field">
                  <label>Fiyat</label>
                  <input
                    className="admin-input"
                    value={variant.price}
                    onChange={(event) => updateVariant(index, { ...variant, price: event.target.value })}
                  />
                </div>
                <div className="admin-field">
                  <label>Eski Fiyat</label>
                  <input
                    className="admin-input"
                    value={variant.compareAtPrice ?? ""}
                    onChange={(event) =>
                      updateVariant(index, { ...variant, compareAtPrice: event.target.value })
                    }
                  />
                </div>
                <div className="admin-field">
                  <label>Para Birimi</label>
                  <select
                    className="admin-input admin-select"
                    value={variant.currency ?? "TRY"}
                    onChange={(event) =>
                      updateVariant(index, { ...variant, currency: event.target.value })
                    }
                  >
                    {currencyOptions.map((option) => (
                      <option key={option} value={option}>
                        {labelFrom(currencyLabels, option)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="admin-field">
                  <label>Taksit Sayısı</label>
                  <input
                    className="admin-input"
                    type="number"
                    value={variant.installmentCount ?? 0}
                    onChange={(event) =>
                      updateVariant(index, {
                        ...variant,
                        installmentCount: Number(event.target.value)
                      })
                    }
                  />
                </div>
                <div className="admin-field">
                  <label>Sıra</label>
                  <input
                    className="admin-input"
                    type="number"
                    value={variant.sortOrder ?? 0}
                    onChange={(event) =>
                      updateVariant(index, { ...variant, sortOrder: Number(event.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="admin-inline-checks">
                <label className="admin-check admin-check--inline">
                  <input
                    type="checkbox"
                    checked={variant.isDefault ?? index === 0}
                    onChange={(event) =>
                      onChange({
                        ...draft,
                        variants: draft.variants.map((entry, entryIndex) => ({
                          ...entry,
                          isDefault: entryIndex === index ? event.target.checked : false
                        }))
                      })
                    }
                  />
                  <span>Varsayılan varyant</span>
                </label>
                <label className="admin-check admin-check--inline">
                  <input
                    type="checkbox"
                    checked={variant.isActive ?? true}
                    onChange={(event) =>
                      updateVariant(index, { ...variant, isActive: event.target.checked })
                    }
                  />
                  <span>Aktif</span>
                </label>
                <label className="admin-check admin-check--inline">
                  <input
                    type="checkbox"
                    checked={variant.hasInstallments ?? false}
                    onChange={(event) =>
                      updateVariant(index, { ...variant, hasInstallments: event.target.checked })
                    }
                  />
                  <span>Taksitli satış</span>
                </label>
              </div>

              {canShowExternalMapping ? (
                <div className="admin-form-grid">
                  <div className="admin-field">
                    <label>Unikazan Paket ID</label>
                    <input
                      className="admin-input"
                      value={variant.externalProductId ?? ""}
                      onChange={(event) =>
                        updateVariant(index, {
                          ...variant,
                          externalProductId: event.target.value
                        })
                      }
                    />
                  </div>
                  <div className="admin-field">
                    <label>Unikazan Seçenek ID</label>
                    <input
                      className="admin-input"
                      value={variant.externalVariantId ?? ""}
                      onChange={(event) =>
                        updateVariant(index, {
                          ...variant,
                          externalVariantId: event.target.value
                        })
                      }
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="admin-subpanel">
        <div className="admin-toolbar admin-toolbar--split">
          <div className="admin-editor-meta">
            <span className="admin-badge">Kart Özellikleri</span>
            <span className="admin-editor-meta__text">
              Kartlarda ve detay sayfalarında gösterilen madde başlıkları
            </span>
          </div>
          <button
            className="admin-button--ghost"
            type="button"
            onClick={() => onChange({ ...draft, features: [...draft.features, createEmptyFeature()] })}
          >
            Özellik Ekle
          </button>
        </div>

        <div className="admin-stack">
          {draft.features.map((feature, index) => (
            <div key={feature.id ?? `feature-${index}`} className="admin-nested-card">
              <div className="admin-toolbar admin-toolbar--split">
                <strong>Özellik {index + 1}</strong>
                <button
                  className="admin-button--ghost"
                  type="button"
                  onClick={() =>
                    onChange({
                      ...draft,
                      features: draft.features.filter((_, entryIndex) => entryIndex !== index)
                    })
                  }
                >
                  Kaldır
                </button>
              </div>

              <div className="admin-form-grid">
                <div className="admin-field">
                  <label>Başlık</label>
                  <input
                    className="admin-input"
                    value={feature.title}
                    onChange={(event) => updateFeature(index, { ...feature, title: event.target.value })}
                  />
                </div>
                <div className="admin-field">
                  <label>İkon Anahtarı</label>
                  <input
                    className="admin-input"
                    value={feature.iconKey ?? ""}
                    onChange={(event) =>
                      updateFeature(index, { ...feature, iconKey: event.target.value })
                    }
                  />
                </div>
                <div className="admin-field">
                  <label>Sıra</label>
                  <input
                    className="admin-input"
                    type="number"
                    value={feature.sortOrder ?? 0}
                    onChange={(event) =>
                      updateFeature(index, { ...feature, sortOrder: Number(event.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="admin-field">
                <label>Açıklama</label>
                <textarea
                  className="admin-input admin-textarea admin-textarea--compact"
                  value={feature.description ?? ""}
                  onChange={(event) =>
                    updateFeature(index, { ...feature, description: event.target.value })
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-subpanel" id="admin-card-preview">
        <div className="admin-toolbar admin-toolbar--split">
          <div className="admin-editor-meta">
            <span className="admin-badge">Step 4 — Önizleme ve Yayın</span>
            <span className="admin-editor-meta__text">Public kart bileşeniyle gerçek önizleme</span>
          </div>
          <div className="admin-segmented-control" role="group" aria-label="Önizleme modu">
            <button
              type="button"
              aria-pressed={previewMode === "desktop"}
              className={
                previewMode === "desktop"
                  ? "admin-segmented-control__item admin-segmented-control__item--active"
                  : "admin-segmented-control__item"
              }
              onClick={() => onPreviewModeChange("desktop")}
            >
              Desktop Card
            </button>
            <button
              type="button"
              aria-pressed={previewMode === "mobile"}
              className={
                previewMode === "mobile"
                  ? "admin-segmented-control__item admin-segmented-control__item--active"
                  : "admin-segmented-control__item"
              }
              onClick={() => onPreviewModeChange("mobile")}
            >
              Mobile Card
            </button>
          </div>
        </div>

        {contentWarnings.length ? (
          <ul className="admin-warning-list" role="status">
            {contentWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : null}

        <div className="admin-preview-and-checklist">
          <div className="admin-package-preview" data-preview-mode={previewMode}>
            <PackageCard product={previewProduct} previewMode />
          </div>

          <div className="admin-readiness-list" aria-label="Yayın hazırlık listesi">
            {readiness.map((item) => (
              <div key={item.key} className="admin-readiness-item" data-ready={item.ready}>
                <strong className="admin-readiness-item__status">{item.ready ? "Hazır" : "Eksik"}</strong>
                <span>{item.label}</span>
                <p>{item.message}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function OrderManagementPanel({
  order,
  saving,
  orderNoteDraft,
  orderStatusDraft,
  paymentStatusDraft,
  externalStatusDraft,
  manualReviewDraft,
  onOrderNoteChange,
  onOrderStatusChange,
  onPaymentStatusChange,
  onExternalStatusChange,
  onManualReviewChange,
  onSaveNote,
  onApplyStatus,
  onRecordManualReview
}: {
  order: AdminOrderDetail;
  saving: boolean;
  orderNoteDraft: string;
  orderStatusDraft: string;
  paymentStatusDraft: string;
  externalStatusDraft: string;
  manualReviewDraft: string;
  onOrderNoteChange: (value: string) => void;
  onOrderStatusChange: (value: string) => void;
  onPaymentStatusChange: (value: string) => void;
  onExternalStatusChange: (value: string) => void;
  onManualReviewChange: (value: string) => void;
  onSaveNote: () => void;
  onApplyStatus: () => void;
  onRecordManualReview: () => void;
}) {
  return (
    <div className="admin-form-stack">
      <div className="admin-order-summary-grid">
        <div className="admin-kpi">
          <strong>{labelFrom(orderStatusLabels, order.status)}</strong>
          <span>Sipariş durumu</span>
        </div>
        <div className="admin-kpi">
          <strong>{labelFrom(paymentStatusLabels, order.paymentStatus)}</strong>
          <span>Ödeme durumu</span>
        </div>
        <div className="admin-kpi">
          <strong>
            {order.totalAmount} {order.currency}
          </strong>
          <span>Toplam tutar</span>
        </div>
        <div className="admin-kpi">
          <strong>{order.redirectMode ? "Evet" : "Hayır"}</strong>
          <span>Yönlendirme modu</span>
        </div>
      </div>

      <div className="admin-record-grid admin-record-grid--stackable">
        <section className="admin-subpanel">
          <div className="admin-toolbar admin-toolbar--split">
            <div className="admin-editor-meta">
              <span className="admin-badge">Sipariş Kimliği</span>
              <span className="admin-editor-meta__text">{order.orderNumber}</span>
            </div>
            <span className="admin-order-pill">{order.userEmail}</span>
          </div>

          <div className="admin-detail-grid">
            <div className="admin-list__item">
              <strong>Oluşturulma</strong>
              <div>{formatDateTime(order.createdAt)}</div>
            </div>
            <div className="admin-list__item">
              <strong>Güncellenme</strong>
              <div>{formatDateTime(order.updatedAt)}</div>
            </div>
            <div className="admin-list__item">
              <strong>Sipariş Tarihi</strong>
              <div>{formatDateTime(order.placedAt)}</div>
            </div>
            <div className="admin-list__item">
              <strong>Ödeme Tarihi</strong>
              <div>{formatDateTime(order.paidAt)}</div>
            </div>
            <div className="admin-list__item">
              <strong>İptal Tarihi</strong>
              <div>{formatDateTime(order.cancelledAt)}</div>
            </div>
            <div className="admin-list__item">
              <strong>Kupon</strong>
              <div>{order.couponCode || "Yok"}</div>
            </div>
          </div>

          <div className="admin-form-grid">
            <div className="admin-field">
              <label>İç Not</label>
              <textarea
                className="admin-input admin-textarea admin-textarea--compact"
                value={orderNoteDraft}
                onChange={(event) => onOrderNoteChange(event.target.value)}
              />
            </div>
            <div className="admin-stack">
              <button className="admin-button" type="button" disabled={saving} onClick={onSaveNote}>
                {saving ? "Kaydediliyor..." : "Notu Kaydet"}
              </button>
              <div className="admin-list__item">
                <strong>Ara toplam</strong>
                <div>
                  {order.subtotalAmount} {order.currency}
                </div>
              </div>
              <div className="admin-list__item">
                <strong>İndirim</strong>
                <div>
                  {order.discountAmount} {order.currency}
                </div>
              </div>
              <div className="admin-list__item">
                <strong>Vergi</strong>
                <div>
                  {order.taxAmount} {order.currency}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="admin-subpanel">
          <div className="admin-editor-meta">
            <span className="admin-badge">Durum Aksiyonları</span>
            <span className="admin-editor-meta__text">
              Sipariş, ödeme ve dış provider statülerini kontrollü güncelle
            </span>
          </div>

          <div className="admin-form-grid">
            <div className="admin-field">
              <label>Sipariş Durumu</label>
              <select
                className="admin-input admin-select"
                value={orderStatusDraft}
                onChange={(event) => onOrderStatusChange(event.target.value)}
              >
                {orderStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {labelFrom(orderStatusLabels, option)}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-field">
              <label>Ödeme Durumu</label>
              <select
                className="admin-input admin-select"
                value={paymentStatusDraft}
                onChange={(event) => onPaymentStatusChange(event.target.value)}
              >
                <option value="UNCHANGED">Değiştirme</option>
                {paymentStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {labelFrom(paymentStatusLabels, option)}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-field">
              <label>Dış Sağlayıcı Durumu</label>
              <select
                className="admin-input admin-select"
                value={externalStatusDraft}
                onChange={(event) => onExternalStatusChange(event.target.value)}
              >
                <option value="UNCHANGED">Değiştirme</option>
                {externalStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {labelFrom(externalStatusLabels, option)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button className="admin-button" type="button" disabled={saving} onClick={onApplyStatus}>
            {saving ? "Uygulanıyor..." : "Durumu Uygula"}
          </button>

          <div className="admin-field">
            <label>Manuel İnceleme Notu</label>
            <textarea
              className="admin-input admin-textarea admin-textarea--compact"
              value={manualReviewDraft}
              onChange={(event) => onManualReviewChange(event.target.value)}
              placeholder="Muhasebe notu, dönüş bilgisi veya teknik inceleme özeti"
            />
          </div>

          <button
            className="admin-button--ghost"
            type="button"
            disabled={saving || !manualReviewDraft.trim()}
            onClick={onRecordManualReview}
          >
            Manuel İnceleme Kaydı Oluştur
          </button>
        </section>
      </div>

      <div className="admin-record-grid admin-record-grid--stackable">
        <section className="admin-subpanel">
          <div className="admin-editor-meta">
            <span className="admin-badge">Sipariş Kalemleri</span>
          </div>
          <div className="admin-stack">
            {order.items.map((item) => (
              <div key={item.id} className="admin-list__item">
                <strong>{item.titleSnapshot}</strong>
                <div>
                  {item.quantity} x {item.unitPrice} {order.currency}
                </div>
                <div>{item.variantTitle || item.skuSnapshot || item.productSlug}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-subpanel">
          <div className="admin-editor-meta">
            <span className="admin-badge">Ödeme Kayıtları</span>
          </div>
          <div className="admin-stack">
            {order.payments.map((payment) => (
              <div key={payment.id} className="admin-list__item">
                <strong>
                  {labelFrom(providerLabels, payment.provider)} / {labelFrom(paymentStatusLabels, payment.status)}
                </strong>
                <div>
                  {payment.amount} {payment.currency} - {payment.method}
                </div>
                <div>Deneme: {payment.attempts.length}</div>
                {payment.failureReason ? <div>{payment.failureReason}</div> : null}
              </div>
            ))}
          </div>
        </section>

        <section className="admin-subpanel">
          <div className="admin-editor-meta">
            <span className="admin-badge">Harici Siparişler</span>
          </div>
          <div className="admin-stack">
            {order.externalOrders.length ? (
              order.externalOrders.map((externalOrder) => (
                <div key={externalOrder.id} className="admin-list__item">
                  <strong>
                    {labelFrom(providerLabels, externalOrder.provider)} / {labelFrom(externalStatusLabels, externalOrder.status)}
                  </strong>
                  <div>Referans: {externalOrder.externalReference || "-"}</div>
                  <div>Paket: {externalOrder.externalProductId || "-"}</div>
                  {externalOrder.checkoutUrl ? (
                    <a href={externalOrder.checkoutUrl} target="_blank" rel="noreferrer">
                      Ödeme Linki
                    </a>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="admin-list__item">
                <strong>Harici sipariş yok</strong>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="admin-subpanel">
        <div className="admin-editor-meta">
          <span className="admin-badge">Zaman Çizelgesi</span>
          <span className="admin-editor-meta__text">Sipariş üzerinde kaydedilen operasyon olayları</span>
        </div>
        <div className="admin-timeline">
          {order.timeline.map((entry, index) => (
            <div key={`${entry.timestamp}-${entry.label}-${index}`} className="admin-timeline__item">
              <div className={`admin-timeline__dot admin-timeline__dot--${entry.tone}`} />
              <div className="admin-timeline__content">
                <div className="admin-timeline__top">
                  <strong>{entry.label}</strong>
                  <span>{formatDateTime(entry.timestamp)}</span>
                </div>
                <div className="admin-timeline__meta">
                  <span>{entry.source}</span>
                  <span>{entry.description}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function createEmptyCategory(parentSlug: string | null = null): AdminCatalogCategory {
  return {
    id: undefined,
    slug: "",
    name: "",
    parentSlug,
    description: "",
    seoTitle: "",
    seoDescription: "",
    ctaHref: "",
    sortOrder: 10,
    isActive: true
  };
}

function createEmptyVariant(): AdminCatalogVariant {
  return {
    id: undefined,
    title: "",
    sku: "",
    billingLabel: "",
    price: "0.00",
    compareAtPrice: "",
    currency: "TRY",
    isDefault: false,
    isActive: true,
    hasInstallments: false,
    installmentCount: 0,
    sortOrder: 10,
    externalProductId: "",
    externalVariantId: ""
  };
}

function createEmptyFeature(): AdminCatalogFeature {
  return {
    id: undefined,
    title: "",
    description: "",
    iconKey: "",
    sortOrder: 10
  };
}

function createEmptyProduct(): AdminCatalogProduct {
  return {
    id: undefined,
    slug: "",
    name: "",
    categorySlug: null,
    shortDescription: "",
    description: "",
    type: "VIDEO_PACKAGE",
    provider: "LOCAL",
    publishStatus: "DRAFT",
    isFeatured: false,
    sortOrder: 10,
    accentColor: "blue",
    seoTitle: "",
    seoDescription: "",
    coverImageUrl: "",
    introVideoSourceType: "EMBED",
    introVideoUrl: "",
    introVideoPosterUrl: "",
    introVideoTitle: "",
    variants: [createEmptyVariant()],
    features: [createEmptyFeature()]
  };
}

function cloneCategory(category: AdminCatalogCategory): AdminCatalogCategory {
  return { ...category };
}

function cloneProduct(product: AdminCatalogProduct): AdminCatalogProduct {
  return {
    ...product,
    variants: product.variants.map((variant) => ({ ...variant })),
    features: product.features.map((feature) => ({ ...feature }))
  };
}

function normalizeCategoryDraft(draft: AdminCatalogCategory): SaveAdminCatalogCategoryPayload {
  return normalizeCategoryForSave(draft);
}

function normalizeProductDraft(draft: AdminCatalogProduct): SaveAdminCatalogProductPayload {
  return normalizeProductForSave(draft);
}

function snapshotCategory(draft: AdminCatalogCategory) {
  return JSON.stringify(normalizeCategoryDraft(draft));
}

function snapshotProduct(draft: AdminCatalogProduct) {
  return JSON.stringify(normalizeProductDraft(draft));
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

