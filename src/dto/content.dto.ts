import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
import { ContentType } from '../enums/contentType.enum';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ContentGroup } from '../enums/contentGroup.enum';
import { ContentFormat } from 'src/enums/contentFormat.enum';

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

export class ShowContentQueryRequestDto {
  @ApiProperty({ name: 'w', required: false })
  @IsOptional()
  @IsNumber()
  @Expose({ name: 'w' })
  @Transform(({ value }) => (value ? Number(value) : undefined))
  width?: number;

  @ApiProperty({ name: 'h', required: false })
  @IsOptional()
  @IsNumber()
  @Expose({ name: 'h' })
  @Transform(({ value }) => (value ? Number(value) : undefined))
  height?: number;

  @ApiProperty({ name: 'q', required: false })
  @IsOptional()
  @IsNumber()
  @Expose({ name: 'q' })
  @Transform(({ value }) => (value ? Number(value) : undefined))
  quality?: number;

  @ApiProperty({ name: 'ext', required: false, enum: ContentFormat })
  @IsEnum(ContentFormat)
  @IsOptional()
  @Expose({ name: 'ext' })
  @Transform(({ value }) => (value ? value.toLowerCase() : value))
  extension?: string;
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
  @Transform(({ value }) => (value ? value.toLowerCase() : value))
  key!: string;
}
