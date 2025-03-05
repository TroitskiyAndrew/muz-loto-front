import { Component, OnInit } from '@angular/core';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-loading-overlay',
  templateUrl: './loading-overlay.component.html',
  styleUrl: './loading-overlay.component.scss',
})
export class LoadingOverlayComponent {

  constructor(public loadingService: LoadingService) {}

}
