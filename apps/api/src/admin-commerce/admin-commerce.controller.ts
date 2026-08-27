import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards
} from "@nestjs/common";
import { PERMISSION_KEYS } from "@ega/db";
import { AccessTokenGuard } from "../auth/access-token.guard";
import { CurrentAuth } from "../auth/current-auth.decorator";
import { StaffOnly, RequirePermissions, RequireSuperAdmin } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import type { AuthenticatedRequestContext } from "../auth/auth.types";
import { AdminCommerceService } from "./admin-commerce.service";
import {
  RecordManualReviewDto,
  SaveCatalogDocumentDto,
  SaveProductCategoryDto,
  SaveProductDto,
  UpdateOrderNoteDto,
  UpdateOrderStatusDto
} from "./dto/admin-commerce.dto";

@Controller("admin-commerce")
@UseGuards(AccessTokenGuard, PermissionsGuard)
@StaffOnly()
export class AdminCommerceController {
  constructor(private readonly adminCommerceService: AdminCommerceService) {}

  @Get("catalog")
  @RequireSuperAdmin()
  getCatalogDocument(@CurrentAuth() auth: AuthenticatedRequestContext) {
    return this.adminCommerceService.getCatalogDocument(auth);
  }

  @Get("categories")
  @RequireSuperAdmin()
  listCategories(@CurrentAuth() auth: AuthenticatedRequestContext) {
    return this.adminCommerceService.listCategories(auth);
  }

  @Post("categories")
  @RequireSuperAdmin()
  createCategory(
    @Body() payload: SaveProductCategoryDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminCommerceService.createCategory(payload, auth);
  }

  @Patch("categories/:categoryId")
  @RequireSuperAdmin()
  updateCategory(
    @Param("categoryId") categoryId: string,
    @Body() payload: SaveProductCategoryDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminCommerceService.updateCategory(categoryId, payload, auth);
  }

  @Delete("categories/:categoryId")
  @RequireSuperAdmin()
  deleteCategory(
    @Param("categoryId") categoryId: string,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminCommerceService.deleteCategory(categoryId, auth);
  }

  @Get("products")
  @RequireSuperAdmin()
  listProducts(@CurrentAuth() auth: AuthenticatedRequestContext) {
    return this.adminCommerceService.listProducts(auth);
  }

  @Get("products/:productId")
  @RequireSuperAdmin()
  getProduct(
    @Param("productId") productId: string,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminCommerceService.getProduct(productId, auth);
  }

  @Post("products")
  @RequireSuperAdmin()
  createProduct(
    @Body() payload: SaveProductDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminCommerceService.createProduct(payload, auth);
  }

  @Patch("products/:productId")
  @RequireSuperAdmin()
  updateProduct(
    @Param("productId") productId: string,
    @Body() payload: SaveProductDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminCommerceService.updateProduct(productId, payload, auth);
  }

  @Delete("products/:productId")
  @RequireSuperAdmin()
  deleteProduct(
    @Param("productId") productId: string,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminCommerceService.deleteProduct(productId, auth);
  }

  @Put("catalog")
  @RequireSuperAdmin()
  saveCatalogDocument(
    @Body() payload: SaveCatalogDocumentDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminCommerceService.saveCatalogDocument(payload, auth);
  }

  @Get("orders")
  @RequirePermissions(PERMISSION_KEYS.ordersRead)
  listOrders() {
    return this.adminCommerceService.listOrders();
  }

  @Get("orders/:orderNumber")
  @RequirePermissions(PERMISSION_KEYS.ordersRead)
  getOrder(@Param("orderNumber") orderNumber: string) {
    return this.adminCommerceService.getOrder(orderNumber);
  }

  @Patch("orders/:orderNumber/note")
  @RequirePermissions(PERMISSION_KEYS.ordersManage)
  updateOrderNote(
    @Param("orderNumber") orderNumber: string,
    @Body() payload: UpdateOrderNoteDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminCommerceService.updateOrderNote(orderNumber, payload, auth);
  }

  @Patch("orders/:orderNumber/status")
  @RequirePermissions(PERMISSION_KEYS.ordersManage)
  updateOrderStatus(
    @Param("orderNumber") orderNumber: string,
    @Body() payload: UpdateOrderStatusDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminCommerceService.updateOrderStatus(orderNumber, payload, auth);
  }

  @Post("orders/:orderNumber/manual-review")
  @RequirePermissions(PERMISSION_KEYS.ordersManage)
  recordManualReview(
    @Param("orderNumber") orderNumber: string,
    @Body() payload: RecordManualReviewDto,
    @CurrentAuth() auth: AuthenticatedRequestContext
  ) {
    return this.adminCommerceService.recordManualReview(orderNumber, payload, auth);
  }
}
