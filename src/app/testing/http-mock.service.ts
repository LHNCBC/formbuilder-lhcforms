import { Injectable, Injector } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';

export interface MockRequestResponse {
  req: HttpRequest<any>;
  resp: HttpResponse<any>;
}

@Injectable()
export class HttpMockService implements HttpInterceptor {
  static _mocks: MockRequestResponse [];
  constructor(private mockReqestResonses: MockRequestResponse [] = []) {
    console.log('HttpMockService constructor()!');
    HttpMockService._mocks = mockReqestResonses;
  }

  static get mocks(): MockRequestResponse[] {return HttpMockService._mocks;}
  static set mocks(mocks: MockRequestResponse[]) {HttpMockService._mocks = mocks;}
  static addMock(m: MockRequestResponse) {HttpMockService._mocks.push(m);}

  intercept(request: HttpRequest<any>, next: HttpHandler):
    Observable<HttpEvent<any>> {
    const mockResp = this._getMock(request);
    if (mockResp) {
      console.log('intercept() returning mock!')
      return of(mockResp);
    }

    console.error('Intercept() going next()');
    return next.handle(request);
  }

  _getMock(req: HttpRequest<any>): HttpResponse<any> {
    let ret: HttpResponse<any> = null;
    const theMock = HttpMockService._mocks.some((m) => {
      if(req && req.url && req.url === m.req.url) {
        ret = m.resp;
        return true;
      }
    });
    return ret;
  }
}
