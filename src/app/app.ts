import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RouteProgress } from './layout/route-progress';
import { ToastOutlet } from './shared/ui/toast-outlet';

/** Root: global progress bar + toasts; layouts come from the routes (Shell, admin). */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouteProgress, ToastOutlet],
  template: '<cx-route-progress /><router-outlet /><cx-toast-outlet />',
})
export class App {}
