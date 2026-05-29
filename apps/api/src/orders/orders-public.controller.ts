import { Body, Controller, Get, Headers, Ip, Param, Post, Res } from "@nestjs/common";
import type { Response } from "express";
import { OrdersService } from "./orders.service";
import { RecordOrderReturnDto } from "./dto/record-order-return.dto";

@Controller("orders/public")
export class OrdersPublicController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post(":orderNumber/return")
  recordProviderReturn(
    @Param("orderNumber") orderNumber: string,
    @Body() payload: RecordOrderReturnDto,
    @Ip() ipAddress: string,
    @Headers("x-forwarded-for") forwardedFor: string | undefined,
    @Headers("user-agent") userAgent: string | undefined
  ) {
    return this.ordersService.recordProviderReturn(orderNumber, payload, {
      ipAddress: forwardedFor ?? ipAddress,
      userAgent
    });
  }

  @Get(":orderNumber/status")
  getPublicOrderStatus(@Param("orderNumber") orderNumber: string) {
    return this.ordersService.getPublicOrderStatus(orderNumber);
  }

  @Post("paytr/callback")
  async handlePaytrCallback(
    @Body() callbackPayload: Record<string, string | undefined>,
    @Ip() ipAddress: string,
    @Headers("x-forwarded-for") forwardedFor: string | undefined,
    @Headers("user-agent") userAgent: string | undefined,
    @Res() response: Response
  ) {
    const orderNumber = callbackPayload.merchant_oid;

    if (!orderNumber) {
      response.status(400).send("merchant_oid missing");
      return;
    }

    await this.ordersService.handlePaytrCallback(orderNumber, {
      callbackPayload,
      ipAddress: forwardedFor ?? ipAddress,
      userAgent
    });

    response.status(200).send("OK");
  }
}
