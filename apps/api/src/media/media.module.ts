import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AdminMediaController, PublicMediaController } from "./media.controller";
import { MediaService } from "./media.service";

@Module({
  imports: [AuthModule],
  controllers: [AdminMediaController, PublicMediaController],
  providers: [MediaService]
})
export class MediaModule {}
