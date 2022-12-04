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
      await this.insertImageMetadata(file, contentGroup);
    } else {
      throw new Error(`${contentType} in developing`);
    }

    return `${siteUrl}/content${url}`;
  }

  private async insertImageMetadata(
    file: Express.Multer.File,
    contentGroup: ContentGroup,
  ): Promise<void> {
    const urlOriginImage = this.fetchUrlOriginContent(
      contentGroup,
      file.originalname,
    );
    const imageOrigin = await this.fetchContent(urlOriginImage);

    const urlMetadataOriginImage = this.fetchUrlMetadataOriginContent(
      contentGroup,
      file.originalname,
    );

    const data = {
      lastModified: imageOrigin?.lastModified,
    };
    await axios.post(urlMetadataOriginImage, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  private async uploadImage(
    file: Express.Multer.File,
    contentGroup: ContentGroup,
  ): Promise<string> {
    const url = this.fetchUrlOriginContent(contentGroup, file.originalname);

    const image = await sharp(file.buffer).toBuffer();
    await axios.post(url, image, {
      headers: {
        'Content-Type': file.mimetype,
      },
    });

    return `/${ContentType.Image}/${contentGroup}/${file.originalname}`;
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
    const urlMetadataOriginImage = this.fetchUrlMetadataOriginContent(
      contentGroup,
      key,
    );
    const imageMetadataOrigin = await this.fetchImageMetadataOrigin(
      urlMetadataOriginImage,
    );
    if (!imageMetadataOrigin) {
      return null;
    }

    const urlConvertImage = this.fetchUrlConvertContent(
      contentGroup,
      key,
      width,
      height,
      quality,
      extension,
    );
    const imageConvert = await this.fetchContent(urlConvertImage);

    let content = imageConvert && imageConvert.data;
    let hasUpdated = false;
    if (
      !imageConvert ||
      (imageConvert?.lastModified &&
        imageConvert?.lastModified < imageMetadataOrigin.lastModified)
    ) {
      const urlOriginImage = this.fetchUrlOriginContent(contentGroup, key);
      const imageOrigin = await this.fetchContent(urlOriginImage);

      if (!imageOrigin) {
        return null;
      }

      content = await this.convertImage(
        imageOrigin.data,
        width,
        height,
        quality,
        extension,
      );
      hasUpdated = true;
    }

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

  private async fetchImageMetadataOrigin(url: string): Promise<{
    lastModified: Date;
  } | null> {
    const imageMetadataOrigin = await axios
      .get(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .then((res) => {
        return {
          lastModified: new Date(res.data.lastModified),
        };
      })
      .catch(() => null);

    return imageMetadataOrigin;
  }

  private fetchUrlOriginContent(
    contentGroup: ContentGroup,
    key: string,
  ): string {
    const riakUrl = this.configService.getOrThrow<string>('riakUrl');
    return `${riakUrl}/${
      ContentType.Image
    },${contentGroup}/${key.toLowerCase()}`;
  }

  private fetchUrlMetadataOriginContent(
    contentGroup: ContentGroup,
    key: string,
  ): string {
    return this.fetchUrlOriginContent(contentGroup, key) + ',metadata';
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
