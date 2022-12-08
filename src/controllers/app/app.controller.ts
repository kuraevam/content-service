import {
  Body,
  Controller,
  NotFoundException,
  Param,
  StreamableFile,
  UploadedFile,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  Endpoint,
  EndpointResponse,
  HttpMethod,
} from 'src/decorators/endpoint.decorator';
import { AppService } from '../../modules/app/app.service';
import * as DTO from '../../dto';

@ApiTags('Content')
@Controller({
  path: 'content',
  version: '1',
})
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Endpoint(HttpMethod.POST, {
    path: 'upload',
    apiDoc: {
      summary: 'Upload content',
      req: DTO.CreateContentUploadRequestDto,
      res: DTO.CreateContentUploadResponseDto,
      fileUpload: {
        name: 'file',
        type: DTO.CreateContentUploadFileRequestDto,
      },
    },
  })
  async createContentUpload(
    @UploadedFile() file: Express.Multer.File,
    @Body() data: DTO.CreateContentUploadRequestDto,
  ): EndpointResponse<DTO.CreateContentUploadResponseDto> {
    const url = await this.appService.uploadContent(
      file,
      data.contentType,
      data.contentGroup,
    );

    return {
      dto: DTO.CreateContentUploadResponseDto,
      data: {
        url,
      },
    };
  }

  @Version(VERSION_NEUTRAL)
  @Endpoint(HttpMethod.GET, {
    path: ':contentType/:contentGroup/:options/:key',
    apiDoc: {
      summary: 'Fetch content',
    },
  })
  async showContent(
    @Param() param: DTO.ShowContentParamRequestDto,
  ): Promise<StreamableFile> {
    const content = await this.appService.convertContent(
      param.contentType,
      param.contentGroup,
      param.key,
      param.options,
    );

    if (!content) {
      throw new NotFoundException();
    }

    return new StreamableFile(content);
  }
}
