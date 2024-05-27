import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment-timezone';

@Pipe({
  name: 'timezoneOffset'
})
export class TimezoneOffsetPipe implements PipeTransform {

  constructor() {}
  transform(timezone: string = ''): string {
	const offset = moment().format('Z'); // e.g., +05:30 or -04:00
    return `UTC${offset}`;
  }
}
