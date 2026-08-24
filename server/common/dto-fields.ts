import {Transform} from 'class-transformer';

export const emptyStringToUndefined = ({value}: {value: unknown}) => value === '' ? undefined : value;

export const emptyStringToNull = ({value}: {value: unknown}) => value === '' ? null : value;
