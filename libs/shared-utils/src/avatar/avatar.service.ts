import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Imgproxy from 'imgproxy';
import { nanoid } from 'nanoid';
import { MinioService } from 'nestjs-minio-client';

@Injectable()
export class AvatarService {
  private readonly imgproxy: Imgproxy;

  constructor(
    private readonly config: ConfigService,
    private readonly minioService: MinioService,
  ) {
    this.imgproxy = new Imgproxy({
      baseUrl: this.config.getOrThrow<string>('imgproxy.baseUrl'),
      key: this.config.getOrThrow<string>('imgproxy.key'),
      salt: this.config.getOrThrow<string>('imgproxy.salt'),
      encode: this.config.getOrThrow<boolean>('imgproxy.encode'),
    });
  }

  generateDefaultAvatarUrl(): string {
    return `https://www.gravatar.com/avatar/${nanoid(16)}.jpg?s=${256}&d=identicon`;
  }

  generateImgproxyAvatarUrl(file: Express.Multer.File, size: number): string {
    const ext = file?.mimetype.toLowerCase().split('.').pop()?.split('/')[1];
    if (!ext) {
      throw new BadRequestException({
        status: 'failed',
        message: 'File MIME type is not allowed.',
      });
    }

    const imageId = nanoid(16);
    const fileName = `avatar/${imageId}.${ext}`;

    const URL = `s3://ad-ud/${fileName}`;

    const resizedUrl = this.resize(URL, size, size);

    return resizedUrl;
  }

  async upload(file: Express.Multer.File): Promise<string> {
    const ext = file?.mimetype.toLowerCase().split('.').pop()?.split('/')[1];

    if (!ext) {
      throw new BadRequestException({
        status: 'failed',
        message: 'File MIME type is not allowed.',
      });
    }
    return await this.handleUpload(file.buffer, ext);
  }

  private async handleUpload(file: Buffer, ext: string): Promise<string> {
    const imageId = nanoid(16);
    const fileName = `avatar/${imageId}.${ext}`;

    await this.minioService.client.putObject('ad-ud', fileName, file, {
      'Content-Type': `image/${ext}`,
    });

    const URL = `s3://ad-ud/${fileName}`;

    return URL;
  }

  resize(sourceUrl: string, width: number, height: number): string {
    const resizedUrl = this.imgproxy
      .builder()
      .resize('fit', width, height, true)
      // .format('png')
      .generateUrl(sourceUrl);

    return resizedUrl;
  }
}
