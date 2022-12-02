import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContentGroup } from 'src/enums/contentGroup.enum';
import { ContentType } from 'src/enums/contentType.enum';
import axios from 'axios';
import sharp from 'sharp';

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

  async uploadImage(
    file: Express.Multer.File,
    contentGroup: ContentGroup,
  ): Promise<string> {
    const url = this.configService.getOrThrow<string>('riakUrl');

    const urlImage = `/${ContentType.Image}-${contentGroup}/${file.originalname}`;

    const image = await sharp(file.buffer).toBuffer();
    await axios.post(`${url}${urlImage}`, image, {
      headers: {
        'Content-Type': file.mimetype,
      },
    });

    return urlImage;
  }
}
