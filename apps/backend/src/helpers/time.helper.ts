import { Injectable } from '@nestjs/common';

@Injectable()
export class TimeHelper {
  public toISODate(raw: string): Date {
    const datetimeRegex = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(\d{3})Z$/;
    const datetimeReplacePattern = "$1-$2-$3T$4:$5:$6.$7Z";
    const isoString = raw.replace(datetimeRegex, datetimeReplacePattern);
    return new Date(isoString);
  }
}
