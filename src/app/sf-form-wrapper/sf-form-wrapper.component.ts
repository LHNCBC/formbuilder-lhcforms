import {
  AfterViewInit, ChangeDetectorRef,
  Component,
  ComponentFactoryResolver, EventEmitter, Input,
  OnChanges,
  OnDestroy,
  OnInit, Output,
  SimpleChanges, ViewChild, ViewContainerRef
} from '@angular/core';
import {ShareObjectService} from '../share-object.service';
import {FormService} from '../services/form.service';
import {LinkIdCollection} from '../item/item.component';

@Component({
  selector: 'lfb-sf-form-wrapper',
  templateUrl: './sf-form-wrapper.component.html',
  styleUrls: ['./sf-form-wrapper.component.css']
})
export class SfFormWrapperComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @ViewChild('itemForm', {read: ViewContainerRef}) itemForm: ViewContainerRef;

  mySchema: any = {properties: {}};
  myTestSchema: any;
  @Output()
  setLinkId = new EventEmitter();
  @Input()
  model: any;
  @Output()
  modelChange = new EventEmitter<any>();
  @Output()
  valueChange = new EventEmitter<any>();
  @Input()
  linkIdCollection = new LinkIdCollection();

  constructor(private modelService: ShareObjectService, private formService: FormService,
              private cfr: ComponentFactoryResolver, private cd: ChangeDetectorRef) {
    this.mySchema = formService.getItemSchema();
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('sf-form-wrapper.ngOnChanges()');
    if(changes.model) {
      console.log('sf-form-wrapper.ngOnChanges(): model changed');
      this.model = changes.model.currentValue;
    }
  }

  updateValue(value) {
    this.valueChange.emit(value);
    this.modelChange.emit(this.model);
  }


  ngOnDestroy() {
  }
}
