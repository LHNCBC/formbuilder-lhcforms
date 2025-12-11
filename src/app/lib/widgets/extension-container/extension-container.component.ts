import {
  AfterViewInit, ChangeDetectorRef,
  Component, inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import {ExtensionComponent} from "../extension/extension.component";
import {ArrayProperty} from "@lhncbc/ngx-schema-form";
import {LfbControlWidgetComponent} from "../lfb-control-widget/lfb-control-widget.component";
import {FormsModule} from "@angular/forms";
import {AppFormElementComponent} from "../form-element/form-element.component";

@Component({
  selector: 'lfb-extension-container',
  imports: [
    FormsModule,
    AppFormElementComponent
  ],
  templateUrl: './extension-container.component.html',
})
export class ExtensionContainerComponent extends LfbControlWidgetComponent implements OnInit, AfterViewInit {

  extensionsProperty: ArrayProperty;
  @ViewChild('extContainer', {read: AppFormElementComponent, static: true}) extContainer: AppFormElementComponent;
  extComponent: ExtensionComponent;
  cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  ngOnInit(): void {
    this.extensionsProperty = this.formProperty.searchProperty('/extension') as ArrayProperty;
    super.ngOnInit();
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this.extComponent = this.extContainer.widget as ExtensionComponent;
  }

  onHideChange(event: Event) {
    const bool = (event.target as HTMLInputElement).checked;
    if(bool) {
      this.extComponent.hideUneditableRows();
    }
    else {
      this.extComponent.showAllRows();
    }
  }
}
