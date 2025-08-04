import { Injectable } from '@nestjs/common';
import { TimeRange } from '../constants/time.const';

@Injectable()
export class TimeHelper {
  public toISODate(raw: string): Date {
    const datetimeRegex = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(\d{3})Z$/;
    const datetimeReplacePattern = "$1-$2-$3T$4:$5:$6.$7Z";
    const isoString = raw.replace(datetimeRegex, datetimeReplacePattern);
    return new Date(isoString);
  }
  public getSinceDatetime(timeRange?: TimeRange): string {
    if (!timeRange) {
        return '1970-01-01T00:00:00Z'; // Default to a very old date if no range is specified
    }
    const now = new Date();
    switch (timeRange) {
        case TimeRange.HOUR:
            now.setHours(now.getHours() - 1);
            break;
        case TimeRange.DAY:
            now.setDate(now.getDate() - 1);
            break;
        case TimeRange.WEEK:
            now.setDate(now.getDate() - 7);
            break;
    }
    return now.toISOString();
}
}


