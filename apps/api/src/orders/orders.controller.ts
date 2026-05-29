import {
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Param,
  Post,
  UseGuards
} from "@nestjs/common";
import { AccessTokenGuard } from "../auth/access-token.guard";
import { CurrentAuth } from "../auth/current-auth.decorator";
import type { AuthenticatedRequestContext } from "../auth/auth.types";
import { CreateOrderDto } from "./dto/create-order.dto";
import { LinkUnikazanAccountDto } from "./dto/link-unikazan-account.dto";
import { StartOrderCheckoutDto } from "./dto/start-order-checkout.dto";
import { OrdersService } from "./orders.service";

@Controller("orders")
@UseGuards(AccessTokenGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  createOrder(
    @CurrentAuth() auth: AuthenticatedRequestContext,
    @Body() payload: CreateOrderDto
  ) {
    return this.ordersService.createOrder(auth, payload);
  }

  @Post("integrations/unikazan/link")
  linkUnikazanAccount(
    @CurrentAuth() auth: AuthenticatedRequestContext,
    @Body() payload: LinkUnikazanAccountDto
  ) {
    return this.ordersService.linkUnikazanAccount(auth, payload);
  }

  @Get("my")
  listMyOrders(@CurrentAuth() auth: AuthenticatedRequestContext) {
    return this.ordersService.listMyOrders(auth);
  }

  @Get("my/:orderNumber")
  getMyOrder(
    @CurrentAuth() auth: AuthenticatedRequestContext,
    @Param("orderNumber") orderNumber: string
  ) {
    return this.ordersService.getMyOrder(auth, orderNumber);
  }

  @Post("my/:orderNumber/checkout")
  startCheckout(
    @CurrentAuth() auth: AuthenticatedRequestContext,
    @Param("orderNumber") orderNumber: string,
    @Body() payload: StartOrderCheckoutDto,
    @Ip() ipAddress: string,
    @Headers("x-forwarded-for") forwardedFor: string | undefined,
    @Headers("user-agent") userAgent: string | undefined
  ) {
    return this.ordersService.startCheckout(auth, orderNumber, {
      ...payload,
      ipAddress: forwardedFor ?? ipAddress,
      userAgent
    });
  }
}
