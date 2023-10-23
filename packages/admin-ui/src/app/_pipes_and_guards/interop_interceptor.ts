import {Injectable} from "@angular/core";
import {
	HttpRequest,
	HttpHandler,
	HttpEvent,
	HttpInterceptor
} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable()
export class InteropInterceptor implements HttpInterceptor {

	intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		const position = request.url.indexOf('/_interop/');

		if (position > -1) {
			return next.handle(this.addFSPIOPHeaders(request));
		}

		return next.handle(request);
	}

	addFSPIOPHeaders(request: HttpRequest<any>) {
		return request.clone({
			setHeaders: {
				"accept": `application/vnd.interoperability.${request.url.split('/')[2]}+json;version=1.1`,
				"content-type": `application/vnd.interoperability.${request.url.split('/')[2]}+json;version=1.1`,
			}
		});
	}
}
