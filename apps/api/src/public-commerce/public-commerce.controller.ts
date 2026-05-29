import { Controller, Get, Header, Param } from "@nestjs/common";
import { PublicCommerceService } from "./public-commerce.service";

@Controller("public-commerce")
export class PublicCommerceController {
  constructor(private readonly publicCommerceService: PublicCommerceService) {}

  @Get("catalog")
  @Header("Cache-Control", "no-store")
  getCatalog() {
    return this.publicCommerceService.getCatalog();
  }

  @Get("products/:slug")
  @Header("Cache-Control", "no-store")
  getProductBySlug(@Param("slug") slug: string) {
    return this.publicCommerceService.getProductBySlug(slug);
  }
}
