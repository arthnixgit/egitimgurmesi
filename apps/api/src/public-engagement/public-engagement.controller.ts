import { Body, Controller, Post } from "@nestjs/common";
import { CreateFreeCallRequestDto } from "./dto/create-free-call-request.dto";
import { PublicEngagementService } from "./public-engagement.service";

@Controller("public-engagement")
export class PublicEngagementController {
  constructor(private readonly publicEngagementService: PublicEngagementService) {}

  @Post("free-call-request")
  createFreeCallRequest(@Body() dto: CreateFreeCallRequestDto) {
    return this.publicEngagementService.createFreeCallRequest(dto);
  }
}
