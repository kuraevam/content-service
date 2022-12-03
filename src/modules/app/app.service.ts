import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContentGroup } from 'src/enums/contentGroup.enum';
import { ContentType } from 'src/enums/contentType.enum';
import axios, { AxiosResponse } from 'axios';
import sharp from 'sharp';
import { ContentFormat } from 'src/enums/contentFormat.enum';
import { ErrorMsg } from 'src/enums/errorMsg.enum';

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
    const fileName = file.originalname.toLowerCase();

    const url = this.fetchUrlOriginContent(contentGroup, fileName);

    const image = await sharp(file.buffer).toBuffer();
    await axios.post(url, image, {
      headers: {
        'Content-Type': file.mimetype,
      },
    });

    return `/${ContentType.Image}/${contentGroup}/${fileName}`;
  }

  async convertContent(
    contentType: ContentType,
    contentGroup: ContentGroup,
    key: string,
    width?: number,
    height?: number,
    quality?: number,
    extension?: string,
  ): Promise<Buffer | null> {
    let content = null;
    if (ContentType.Image === contentType) {
      content = await this.fetchConvertImage(
        contentGroup,
        key,
        width,
        height,
        quality,
        extension,
      );
      if (content && content.data && content.hasUpdated) {
        await axios.post(content.url, content.data, {
          headers: {
            'Content-Type': content.mimeType,
          },
        });
      }
    } else {
      throw new Error(`${contentType} in developing`);
    }

    return content && content.data;
  }

  private async fetchConvertImage(
    contentGroup: ContentGroup,
    key: string,
    width?: number,
    height?: number,
    quality?: number,
    extension?: string,
  ): Promise<{
    data: Buffer | null;
    url: string;
    mimeType: string;
    hasUpdated: boolean;
  } | null> {
    // const urlOriginImage = this.fetchUrlOriginContent(contentGroup, key);
    const imageOrigin = null; // await this.fetchContent(urlOriginImage);

    /*if (!imageOrigin) {
      return null;
    }*/

    const urlConvertImage = this.fetchUrlConvertContent(
      contentGroup,
      key,
      width,
      height,
      quality,
      extension,
    );
    const imageConvert = await this.fetchContent(urlConvertImage);

    const content = imageConvert && imageConvert.data;
    const hasUpdated = false;
    /*if (
      !imageConvert ||
      (imageConvert?.lastModified &&
        imageOrigin?.lastModified &&
        imageConvert?.lastModified < imageOrigin?.lastModified)
    ) {
      console.log('CONVERT: YES', urlConvertImage);

      content = await this.convertImage(
        imageOrigin.data,
        width,
        height,
        quality,
        extension,
      );
      hasUpdated = true;
    }*/

    return {
      data: content,
      url: urlConvertImage,
      mimeType: `image/${extension}`,
      hasUpdated,
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

  private fetchUrlOriginContent(
    contentGroup: ContentGroup,
    key: string,
  ): string {
    const riakUrl = this.configService.getOrThrow<string>('riakUrl');
    return `${riakUrl}/${ContentType.Image},${contentGroup}/${key}`;
  }

  private fetchUrlConvertContent(
    contentGroup: ContentGroup,
    key: string,
    width?: number,
    height?: number,
    quality?: number,
    extension?: string,
  ): string {
    const urlOriginContent = this.fetchUrlOriginContent(contentGroup, key);
    return `${urlOriginContent},w=${width ?? ''},h=${height ?? ''},q=${
      quality ?? ''
    },ext=${extension ?? ''}`;
  }

  private async fetchContent(url: string): Promise<{
    data: Buffer;
    lastModified: Date | null;
  } | null> {
    const content: AxiosResponse<Buffer> | null = await axios
      .get(url, {
        responseType: 'arraybuffer',
      })
      .catch(() => {
        return null;
      });

    if (content) {
      const lastModifiedStr = content.headers['last-modified'];
      return {
        data: content.data,
        lastModified: lastModifiedStr ? new Date(lastModifiedStr) : null,
      };
    }
    return null;
  }
}
