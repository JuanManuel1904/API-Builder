import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data) => {
        // If response already has a data wrapper, pass through
        if (data && typeof data === 'object' && 'data' in data) return data;
        // Null responses (e.g. 204 No Content)
        if (data === undefined || data === null) return data;
        return { data };
      }),
    );
  }
}
