/*
https://docs.nestjs.com/providers#services
*/

import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { API_HOST, FILE_TYPE } from 'src/constants';
import { UserEntity } from 'src/entities';
import { FileEntity } from 'src/entities/file.entity';
import * as fs from 'fs';
import { PaginationMetaParams } from 'src/dto/paginationMeta.dto';
import { FetchDto } from 'src/dto/fetch.dto';
import { transformTextSearch } from 'src/helper';
import { Response } from 'express';
import sharp from 'sharp';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

const isImage = (format) => {
  return ['jpeg', 'png', 'webp'].includes(format);
};
const BYTES_IN_MB = 1024 * 1024;
const LIMIT_20MB = 10 * BYTES_IN_MB;

const compressConfig = (originSize: number) => {
  const compressionLevel = ((originSize - LIMIT_20MB) * 100) / originSize;

  return {
    jpeg: {
      quality: Math.floor(compressionLevel),
      adaptiveFiltering: true,
      force: true,
    },
    webp: {
      quality: Math.floor(compressionLevel),
      adaptiveFiltering: true,
      force: true,
    },
    png: {
      quality: Math.floor(compressionLevel),
      adaptiveFiltering: true,
      force: true,
    },
  };
};
@Injectable()
export class FilesService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async createFileImage(image: Express.Multer.File, currentUser: UserEntity) {
    try {
      const apiHost = await this.configService.get(API_HOST);
      const sharpImage = await sharp(image.buffer);
      const metadata = await sharpImage.metadata();
      const { size, format } = metadata;

      if (!isImage(format)) {
        throw new UnprocessableEntityException('Format not supported !');
      }

      if (size < LIMIT_20MB) {
        await sharpImage
          .resize({
            width: 1200,
          })
          .withMetadata();
      } else {
        await sharpImage[format](compressConfig(size)[format])
          .resize({
            width: 1200,
          })
          .withMetadata();
      }
      const fileName = `${uuidv4()}.png`;
      fs.writeFileSync(`./assets/thumnail/${fileName}`, image.buffer);

      const url = `${apiHost}assets/thumnail/${fileName}`;
      const newFile = await this.prisma.file.create({
        data: {
          url,
          name: image.originalname,
          type: FILE_TYPE.image,
          creatorId: currentUser?.id,
        },
      });

      return newFile;
    } catch (e) {
      throw new UnprocessableEntityException(e.message);
    }
  }
  async createFileExcel(file: FileEntity, currentUser: UserEntity) {
    try {
      const result = await this.prisma.file.create({
        data: {
          url: file.url,
          name: file.name,
          type: FILE_TYPE.excel,
          creatorId: currentUser?.id,
        },
      });

      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e.message);
    }
  }

  async paginate(fetchDto: FetchDto, response: Response): Promise<any[]> {
    try {
      const { search, limit, page } = fetchDto;
      const where = {
        ...(search && { name: { search: transformTextSearch(search) } }),
      };

      const result = await this.prisma.file.findMany({
        where,
        take: +limit,
        skip: (+page - 1) * +limit,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
      });

      const totalDocs = await this.prisma.file.count({ where });

      if (response.set) {
        response.set(
          'meta',
          JSON.stringify({
            totalDocs,
            totalPages: Math.ceil(totalDocs / (+limit || 10)),
          } as PaginationMetaParams),
        );
      }

      return result;
    } catch (error) {
      throw new UnprocessableEntityException(error.message);
    }
  }
}
