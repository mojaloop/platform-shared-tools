import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment-timezone';

@Pipe({
  name: 'timezoneOffset'
})
export class TimezoneOffsetPipe implements PipeTransform {
  /**
   * This pipe is used to get the timezone offset of the current time.
   * Using a pipe allows reuse in templates without the need to redefine in each *.component.ts file.
   *
   * @param timezone (optional) - Currently unused.
   * @returns A string representing the current UTC offset, e.g., 'UTC+05:30' or 'UTC-04:00'.
   */
  transform(timezone: string = ''): string {
	const offset = moment().format('Z');
    return `UTC${offset}`;
  }
}
