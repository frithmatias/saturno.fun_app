import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateToString'
})
export class DateToStringPipe implements PipeTransform {
  transform(time: Date, format: string): string {

    var options = {};

    switch (format) {
      case 'full': // Sábado, 20 de Marzo de 2021 21:05
        options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
        break;
      case 'date-full': // Sábado, 20 de Marzo de 2021
        options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        break;
      case 'date-long': // Sábado, 20 de Marzo
        options = { weekday: 'long', month: 'long', day: 'numeric' };
        break;
      case 'date': // 20 de Marzo
        options = { month: 'long', day: 'numeric' };
        break;
      case 'date-short': // 20-03
        options = { month: 'numeric', day: 'numeric' };
        break;
      case 'time-full': // 21:05:34
        options = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
        break;
      case 'time-12': // 9:05 PM
        options = { hour: '2-digit', minute: '2-digit', hour12: true };
        break;
      case 'time-24': // 21:05
        options = { hour: '2-digit', minute: '2-digit', hour12: false };
        break;
    }

    return new Date(time).toLocaleString('es-AR', options);;
  }
}
