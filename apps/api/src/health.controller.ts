import { Controller, Get } from "@nestjs/common";

@Controller()
export class HealthController {
  @Get("health")
  health() {
    return {
      name: "egitim-gurmesi-akademi-api",
      status: "ok",
      timestamp: new Date().toISOString()
    };
  }
}
