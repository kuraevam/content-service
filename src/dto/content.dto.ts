import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { ContentType } from '../enums/contentType.enum';
import { IsEnum } from 'class-validator';
import { ContentGroup } from '../enums/contentGroup.enum';

export class ContentOptionsDto {
  @Expose()
  @ApiProperty({
    enum: ContentType,
  })
  @IsEnum(ContentType)
  contentType!: ContentType;

  @Expose()
  @ApiProperty({
    enum: ContentGroup,
  })
  @IsEnum(ContentGroup)
  contentGroup!: ContentGroup;
}

export class CreateContentUploadRequestDto extends ContentOptionsDto {}

export class CreateContentUploadFileRequestDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
  })
  files!: any;
}

@Exclude()
export class CreateContentUploadResponseDto {
  @ApiProperty()
  @Expose()
  url!: string;
}
