import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
import { ContentType } from '../enums/contentType.enum';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
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

export class ShowContentParamRequestDto {
  @ApiProperty({
    enum: ContentType,
  })
  @IsEnum(ContentType)
  @IsNotEmpty()
  @Transform(({ value }) => (value ? value.toLowerCase() : value))
  contentType!: ContentType;

  @ApiProperty({
    enum: ContentGroup,
  })
  @IsEnum(ContentGroup)
  @IsNotEmpty()
  @Transform(({ value }) => (value ? value.toLowerCase() : value))
  contentGroup!: ContentGroup;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  key!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  options!: string;
}
