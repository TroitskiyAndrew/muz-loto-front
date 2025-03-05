import { AfterViewInit, Component, Inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DialogData, IDialogButton } from '../../models/models';

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss'
})
export class DialogComponent implements AfterViewInit {

  errorMessage = '';

  dialogData: DialogData = { buttons: [{label: 'Ok', action: Promise.resolve, disabled: () => false}]};

  constructor(public dialogRef: MatDialogRef<DialogComponent>, @Inject(MAT_DIALOG_DATA) public data: DialogData) {
    this.dialogData = data;
    if(this.dialogData.errorMessage){
      this.errorMessage = this.dialogData.errorMessage;
    }
  }

  ngAfterViewInit(): void {

    if(this.dialogData.init){
      this.dialogData.init();
    }
  }

  async runAction(button: IDialogButton){
    try {
      await button.action();
      this.closeDialog();
    } catch (error: unknown) {
      this.errorMessage = (error as Error).message;
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

}
