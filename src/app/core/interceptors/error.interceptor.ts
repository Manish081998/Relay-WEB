import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthStore } from '../auth/auth.store';
import { NotificationService } from '../services/notification.service';
import { httpMessage, NOTIFICATION_MESSAGES as NM } from '../constants/notification-messages';
import { API_ENDPOINTS } from '../constants/api-endpoints.constants';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore    = inject(AuthStore);
  const router       = inject(Router);
  const notification = inject(NotificationService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      switch (err.status) {
        case 401:
          if (req.url.includes(API_ENDPOINTS.AUTH.LOGIN)) {
            // Invalid credentials — let the login component handle the error message
            break;
          }
          authStore.logout();
          notification.error(NM.AUTH.SESSION_EXPIRED);
          break;
        case 403:
          router.navigate(['/forbidden']);
          break;
        default: {
          const serverMessage = err.error?.message ?? err.message;
          notification.error(httpMessage(err.status, serverMessage));
        }
      }
      return throwError(() => err);
    }),
  );
};
