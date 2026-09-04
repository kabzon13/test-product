import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';

import { SessionGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { SessionUser } from '../auth/session.service';

import { StorageService } from './storage.service';

class PresignUploadDto {
  @ApiProperty({ example: 'report.pdf' })
  @IsString()
  @MaxLength(255)
  @Matches(/^[^/\\]+$/, { message: 'filename must not contain path separators' })
  filename!: string;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  @MaxLength(255)
  contentType!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  size?: number;
}

@ApiTags('files')
@ApiCookieAuth()
@UseGuards(SessionGuard)
@Controller('files')
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Post('presign-upload')
  @HttpCode(200)
  @ApiOperation({ operationId: 'presignUpload' })
  presignUpload(@CurrentUser() user: SessionUser, @Body() dto: PresignUploadDto) {
    return this.storage.presignUpload({
      userId: user.id,
      filename: dto.filename,
      contentType: dto.contentType,
      size: dto.size,
    });
  }

  @Post(':id/complete')
  @HttpCode(204)
  @ApiOperation({ operationId: 'completeUpload' })
  async complete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.storage.markUploaded(id);
  }

  @Get(':id/download-url')
  @ApiOperation({ operationId: 'presignDownload' })
  presignDownload(@Param('id', ParseUUIDPipe) id: string) {
    return this.storage.presignDownload(id);
  }
}
