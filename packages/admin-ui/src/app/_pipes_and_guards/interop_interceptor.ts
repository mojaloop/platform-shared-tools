import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class InteropInterceptor implements HttpInterceptor {

  constructor() {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let position = request.url.indexOf('/_interop/');

    if (position > -1) {
        return next.handle(this.addFSPIOPHeaders(request));
    }

    return next.handle(request);
  }

  addFSPIOPHeaders(request: HttpRequest<any>) {
    return request.clone({
        setHeaders: {
          "accept": "application/vnd.interoperability.parties+json;version=1.0",
          "content-type": "application/vnd.interoperability.parties+json,version=1.0",
        }
    })
  }
}
