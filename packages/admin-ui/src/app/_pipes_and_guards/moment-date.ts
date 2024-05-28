import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment-timezone';

@Pipe({
  name: 'momentDate'
})
export class MomentDatePipe implements PipeTransform {

  transform(value: any, format: string = 'YYYY-MM-DDTHH:mm:ssZ', timezone: string = moment.tz.guess()): any {
    if (!value) return '';

    return moment(value).tz(timezone).format(format);
  }

}
