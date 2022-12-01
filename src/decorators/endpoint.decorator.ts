import {
  applyDecorators,
  Delete,
  Get,
  Head,
  HttpCode,
  HttpStatus,
  Options,
  Patch,
  Post,
  Put,
  Type,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  getSchemaPath,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ClassConstructor, ClassTransformOptions } from 'class-transformer';
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import * as DTO from '../dto';

export enum HttpMethod {
  GET,
  POST,
  PUT,
  PATCH,
  DELETE,
  HEAD,
  OPTIONS,
}

export interface EndpointResponseBody<
  D = Record<string, any>,
  M = Record<string, any>,
> {
  dto: ClassConstructor<D>;
  meta?: M;
  errors?: M;
  options?: ClassTransformOptions;
}

export interface SingularReponseBody<
  D = Record<string, any>,
  M = Record<string, any>,
> extends EndpointResponseBody<D, M> {
  data: D;
}

export interface CollectionResponseBody<
  D = Record<string, any>,
  M = Record<string, any>,
> extends EndpointResponseBody<D, M> {
  data: D[];
}

export type EndpointResponse<D> = Promise<SingularReponseBody<D>>;
export type CollectionResponse<D> = Promise<CollectionResponseBody<D>>;
export type EmptyEndpointResponse = Promise<void>;

const HttpRouter: Record<
  HttpMethod,
  (path?: string | string[]) => MethodDecorator
> = {
  [HttpMethod.GET]: Get,
  [HttpMethod.POST]: Post,
  [HttpMethod.PUT]: Put,
  [HttpMethod.PATCH]: Patch,
  [HttpMethod.DELETE]: Delete,
  [HttpMethod.HEAD]: Head,
  [HttpMethod.OPTIONS]: Options,
};

export interface EndpointResponseOptions {
  status?: HttpStatus;
  schema?: SchemaObject;
}

export type EndpointResponseType = [
  HttpStatus,
  Type<unknown>?,
  EndpointResponseOptions?,
];

export interface EndpointOptions {
  path?: string | string[];
  apiDoc: {
    summary: string;
    req?: Type<unknown>;
    res?: Type<unknown>;
    stage?: string;
    fileUpload?: {
      name: 'file' | 'files';
      type: Type<unknown>;
    };
  };
}

function getResponseSchema(model?: Type<unknown>): SchemaObject {
  let schema: SchemaObject;

  if (model) {
    const data: any = {
      $ref: getSchemaPath(model),
    };
    schema = {
      allOf: [
        {
          properties: {
            data,
          },
        },
      ],
    };
  } else {
    schema = {
      allOf: [
        {
          properties: {},
        },
      ],
    };
  }

  return schema;
}

export function Endpoint(
  method: HttpMethod,
  options: EndpointOptions,
): MethodDecorator {
  const extraModels: Type<unknown>[] = [];
  const decorators: MethodDecorator[] = [
    HttpCode(HttpStatus.OK),
    HttpRouter[method](options.path),
    ApiOperation({
      summary: options.apiDoc.summary,
    }),
  ];

  if (options.apiDoc.fileUpload?.name) {
    decorators.push(ApiConsumes('multipart/form-data'));
    if (options.apiDoc.fileUpload?.name === 'file') {
      // @UploadedFile() file: Express.Multer.File
      decorators.push(
        UseInterceptors(FileInterceptor(options.apiDoc.fileUpload.name)),
      );
    }

    if (options.apiDoc.fileUpload?.name === 'files') {
      // @UploadedFiles() files: Array<Express.Multer.File>,
      decorators.push(
        UseInterceptors(FilesInterceptor(options.apiDoc.fileUpload.name)),
      );
    }
  }

  // Request
  if (options.apiDoc.fileUpload?.type) {
    if (options.apiDoc.req) {
      extraModels.push(options.apiDoc.req, options.apiDoc.fileUpload.type);
      decorators.push(
        ApiBody({
          schema: {
            allOf: [
              {
                $ref: getSchemaPath(options.apiDoc.fileUpload.type),
              },
              {
                $ref: getSchemaPath(options.apiDoc.req),
              },
            ],
          },
        }),
      );
    }
  } else {
    if (options.apiDoc.req) {
      decorators.push(
        ApiBody({
          schema: {
            allOf: [
              {
                properties: {
                  data: {
                    $ref: getSchemaPath(options.apiDoc.req),
                  },
                },
              },
            ],
          },
        }),
      );
      extraModels.push(options.apiDoc.req);
    }
  }

  // Response OK
  decorators.push(
    ApiResponse({
      status: HttpStatus.OK,
      schema: options.apiDoc.res
        ? getResponseSchema(options.apiDoc.res)
        : getResponseSchema(),
    }),
  );
  if (options.apiDoc.res) {
    extraModels.push(options.apiDoc.res);
  }

  // Response BAD_REQUEST
  decorators.push(
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      schema: {
        allOf: [
          {
            $ref: getSchemaPath(DTO.ErrorResponseDto),
          },
        ],
      },
    }),
  );
  extraModels.push(DTO.ErrorResponseDto);

  return applyDecorators(...decorators, ApiExtraModels(...extraModels));
}
