import {BadRequestException, InternalServerErrorException, Logger} from '@nestjs/common';

const databaseLogger = new Logger('Database');

export type ResourceQuery = {
  page?: string | number;
  pageSize?: string | number;
  name?: string;
  phone?: string;
  status?: string;
  createdAt?: string;
  code?: string;
  updatedAt?: string;
  owner?: string;
  path?: string;
  sortKey?: string;
  sortDirection?: string;
  [key: string]: string | number | undefined;
};

export function pageQuery(query: ResourceQuery) {
  const read = (value: string | number | undefined, fallback: number, maximum: number) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
  };
  const page = read(query.page, 1, 1_000_000);
  const pageSize = read(query.pageSize, 10, 100);
  return {page, pageSize, start: (page - 1) * pageSize};
}

export function databaseError(message: string, code?: string) {
  databaseLogger.error(`PostgreSQL error ${code ?? 'unknown'}: ${message}`);
  if (code === '23505') return new BadRequestException({code: 'RESOURCE_CONFLICT'});
  if (code === '23503') return new BadRequestException({code: 'INVALID_REFERENCE'});
  if (code === '23514') return new BadRequestException({code: 'INVALID_RESOURCE_DATA'});
  if (code === '22023') return new BadRequestException({code: 'INVALID_RESOURCE_DATA'});
  return new InternalServerErrorException({code: 'DATABASE_ERROR'});
}

export function relationName(relation: {name: string} | Array<{name: string}> | null | undefined) {
  return Array.isArray(relation) ? relation[0]?.name ?? '' : relation?.name ?? '';
}
