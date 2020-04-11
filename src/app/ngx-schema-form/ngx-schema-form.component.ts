import {Component, Input, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ShareObjectService} from '../share-object.service';

@Component({
  selector: 'app-ngx-schema-form',
  templateUrl: './ngx-schema-form.component.html',
  styleUrls: ['./ngx-schema-form.component.css']
})
export class NgxSchemaFormComponent implements OnInit {
  mySchema: any = {properties: {}};
  myTestSchema: any;
  @Input()
  node: any;
  model: any;
  constructor(private http: HttpClient, private modelService: ShareObjectService) {
  }

  ngOnInit() {
    this.http
      .get('/assets/ngx-item.schema.json', { responseType: 'json' })
      .subscribe(schema => {
        this.mySchema = schema;
      });
    this.http
      .get('/assets/test.schema.json', { responseType: 'json' })
      .subscribe(schema => {
        this.myTestSchema = schema;
      });

    this.modelService.object.subscribe((model) => {
      if (this.model !== model) {
        this.model = model;
      }
    });
  }

  updateModel(model) {
    this.modelService.setObject(model);
  }
}
