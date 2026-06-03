import {
  AfterViewInit,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import {ExtensionComponent} from "../extension/extension.component";
import {ArrayProperty} from "@lhncbc/ngx-schema-form";
import {LfbControlWidgetComponent} from "../lfb-control-widget/lfb-control-widget.component";
import {FormsModule} from "@angular/forms";
import {AppFormElementComponent} from "../form-element/form-element.component";

/**
 * A container component for extensions.
 * It contains an ExtensionComponent and a checkbox to hide/show uneditable extension rows.
 */
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
  ngOnInit(): void {
    // Get the extensions property to pass to the lfb-form-element, which will create an ExtensionComponent reading the
    // schema.widget and widget registry.
    this.extensionsProperty = this.formProperty.searchProperty('/extension') as ArrayProperty;
    super.ngOnInit();
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    // Access the ExtensionComponent created inside the lfb-form-element.
    this.extComponent = this.extContainer.widget as ExtensionComponent;
  }

  /**
   * Handle hide/show uneditable rows checkbox change event.
   * @param event - Generic DOM event fired on change.
   */
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
