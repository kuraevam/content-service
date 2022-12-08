import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContentGroup } from 'src/enums/contentGroup.enum';
import { ContentType } from 'src/enums/contentType.enum';
import sharp from 'sharp';
import { ContentFormat } from 'src/enums/contentFormat.enum';
import { ErrorMsg } from 'src/enums/errorMsg.enum';
import fs from 'fs';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  async uploadContent(
    file: Express.Multer.File,
    contentType: ContentType,
    contentGroup: ContentGroup,
  ): Promise<string> {
    const siteUrl = this.configService.getOrThrow<string>('siteUrl');
    let url = '';
    if (ContentType.Image === contentType) {
      url = await this.uploadImage(file, contentGroup);
    } else {
      throw new Error(`${contentType} in developing`);
    }

    return `${siteUrl}/content${url}`;
  }

  private async uploadImage(
    file: Express.Multer.File,
    contentGroup: ContentGroup,
  ): Promise<string> {
    const fileName = await this.fetchFileName(file.buffer);

    const pathOriginContent = this.fetchPathOriginContent(
      contentGroup,
      fileName,
    );

    const image = sharp(file.buffer);
    const imageMetadata = await image.metadata();

    const imageStream = fs.createWriteStream(pathOriginContent);
    image.pipe(imageStream);

    return `/${ContentType.Image}/${contentGroup}/w:${imageMetadata.width}_h:${imageMetadata.height}/${fileName}`;
  }

  async convertContent(
    contentType: ContentType,
    contentGroup: ContentGroup,
    key: string,
    options: string,
  ): Promise<Buffer | null> {
    let content = null;
    if (ContentType.Image === contentType) {
      content = await this.fetchConvertImage(contentGroup, key, options);
    } else {
      throw new Error(`${contentType} in developing`);
    }

    return content && content.data;
  }

  private parseOptions(data: string): {
    width: number | undefined;
    height: number | undefined;
    quality: number | undefined;
    extension: string | undefined;
  } {
    const options: {
      width: number | undefined;
      height: number | undefined;
      quality: number | undefined;
      extension: string | undefined;
    } = {
      width: undefined,
      height: undefined,
      quality: undefined,
      extension: undefined,
    };

    const params = data.split('_');

    for (const param of params) {
      let [key, value] = param.split(':');

      if (key && value) {
        key = key.toLowerCase();
        value = value.toLowerCase();
        if (key === 'w') {
          const num = Number(value);
          options.width = isNaN(num) ? undefined : num;
        }
        if (key === 'h') {
          const num = Number(value);
          options.height = isNaN(num) ? undefined : num;
        }
        if (key === 'q') {
          const num = Number(value);
          options.quality = isNaN(num) ? undefined : num;
        }
        if (key === 'ext') {
          options.extension = value;
        }
      }
    }
    return options;
  }

  private async fetchConvertImage(
    contentGroup: ContentGroup,
    key: string,
    options: string,
  ): Promise<{
    data: Buffer | null;
  } | null> {
    const pathOriginImage = this.fetchPathOriginContent(contentGroup, key);

    const image = fs.readFileSync(pathOriginImage);

    if (!image) {
      return null;
    }

    const { width, height, quality, extension } = this.parseOptions(options);

    const newImage = await this.convertImage(
      image,
      width,
      height,
      quality,
      extension,
    );

    const pathConvertContent = this.fetchPathConvertContent(
      contentGroup,
      key,
      options,
    );

    const imageStream = fs.createWriteStream(pathConvertContent);
    sharp(newImage).pipe(imageStream);

    return {
      data: newImage,
    };
  }

  private async convertImage(
    image: Buffer,
    width?: number,
    height?: number,
    quality?: number,
    extension: string = ContentFormat.Webp,
  ): Promise<Buffer> {
    extension = extension.toLowerCase();

    const originImage = sharp(image);
    const originImageMetadata = await originImage.metadata();

    const resized: sharp.Sharp = originImage.resize({
      width: width || undefined,
      height: height || undefined,
    });

    let newImage: Buffer;

    if (originImageMetadata.format === extension) {
      newImage = await resized.toBuffer();
    } else if (ContentFormat.Webp == extension) {
      newImage = await resized.webp({ quality }).toBuffer();
    } else if (ContentFormat.Avif == extension) {
      newImage = await resized.avif({ quality }).toBuffer();
    } else {
      throw new BadRequestException(ErrorMsg.NotExtConverImage);
    }

    return newImage;
  }

  private async fetchFileName(data: Buffer): Promise<string> {
    const { createHash } = await import('crypto');
    const l = createHash('sha256').update(data).digest('hex').toLowerCase();
    const uuid = `${l.slice(0, 8)}-${l.slice(8, 12)}-${l.slice(
      12,
      16,
    )}-${l.slice(16, 20)}-${l.slice(20, 32)}`;

    return uuid;
  }

  private fetchPathOriginContent(
    contentGroup: ContentGroup,
    key: string,
  ): string {
    const storageFolger =
      this.configService.getOrThrow<string>('storageFolder');
    const dir = `${storageFolger}/origin/content/${ContentType.Image}/${contentGroup}`;
    fs.mkdirSync(dir, { recursive: true });
    return `${dir}/${key}`;
  }

  private fetchPathConvertContent(
    contentGroup: ContentGroup,
    key: string,
    options: string,
  ): string {
    const storageFolger =
      this.configService.getOrThrow<string>('storageFolder');
    const dir = `${storageFolger}/convert/content/${ContentType.Image}/${contentGroup}/${options}`;
    fs.mkdirSync(dir, { recursive: true });
    return `${dir}/${key}`;
  }
}
