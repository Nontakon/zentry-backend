import { Test, TestingModule } from '@nestjs/testing';
import { TimeHelper } from './time.helper';
import { TimeRange } from '../constants/time.const';

describe('TimeHelper', () => {
  let helper: TimeHelper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TimeHelper],
    }).compile();

    helper = module.get<TimeHelper>(TimeHelper);
  });

  describe('toISODate', () => {
    it('should correctly convert a compact datetime string to a Date object', () => {
      const rawString = '20250804T153000123Z';
      const expectedDate = new Date('2025-08-04T15:30:00.123Z');
      const result = helper.toISODate(rawString);
      expect(result.getTime()).toEqual(expectedDate.getTime());
    });

    it('should return an invalid Date for a malformed string', () => {
      const malformedString = 'not-a-date';
      const result = helper.toISODate(malformedString);
      expect(isNaN(result.getTime())).toBe(true);
    });
  });

  describe('getSinceDatetime', () => {
    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-08-10T10:00:00.000Z'));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('should return the epoch start date if timeRange is undefined', () => {
      const expectedDate = new Date('1970-01-01T00:00:00.000Z');
      const resultString = helper.getSinceDatetime(undefined);
      const resultDate = new Date(resultString);
      expect(resultDate.getTime()).toBe(expectedDate.getTime());
    });

    it('should return a datetime string for 1 hour ago', () => {
      const expected = new Date('2025-08-10T09:00:00.000Z').toISOString();
      const result = helper.getSinceDatetime(TimeRange.HOUR);
      expect(result).toBe(expected);
    });

    it('should return a datetime string for 1 day ago', () => {
      const expected = new Date('2025-08-09T10:00:00.000Z').toISOString();
      const result = helper.getSinceDatetime(TimeRange.DAY);
      expect(result).toBe(expected);
    });

    it('should return a datetime string for 1 week (7 days) ago', () => {
      const expected = new Date('2025-08-03T10:00:00.000Z').toISOString();
      const result = helper.getSinceDatetime(TimeRange.WEEK);
      expect(result).toBe(expected);
    });
  });
});
