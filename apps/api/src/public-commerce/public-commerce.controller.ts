import { Controller, Get, Param } from "@nestjs/common";
import { PublicCommerceService } from "./public-commerce.service";

@Controller("public-commerce")
export class PublicCommerceController {
  constructor(private readonly publicCommerceService: PublicCommerceService) {}

  @Get("catalog")
  getCatalog() {
    return this.publicCommerceService.getCatalog();
  }

  @Get("products/:slug")
  getProductBySlug(@Param("slug") slug: string) {
    return this.publicCommerceService.getProductBySlug(slug);
  }
}
