import {
  Body,
  Controller,
  NotFoundException,
  Param,
  Query,
  StreamableFile,
  UploadedFile,
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

  @Endpoint(HttpMethod.GET, {
    path: ':contentType/:contentGroup/:key',
    apiDoc: {
      summary: 'Fetch content',
    },
  })
  async showContent(
    @Param() param: DTO.ShowContentParamRequestDto,
    @Query() query: DTO.ShowContentQueryRequestDto,
  ): Promise<StreamableFile> {
    const content = await this.appService.convertContent(
      param.contentType,
      param.contentGroup,
      param.key,
      query.width,
      query.height,
      query.quality,
      query.extension,
    );

    if (!content) {
      throw new NotFoundException();
    }

    return new StreamableFile(content);
  }
}
