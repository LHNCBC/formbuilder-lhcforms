import { Injectable } from '@angular/core';
import jsonTraverse from "traverse";

import { Util } from '../lib/util';
// @ts-ignore
import flSchema from "../../assets/ngx-fl.schema.json5";
// @ts-ignore
import ilSchema from "../../assets/ngx-item.schema.json5";
// @ts-ignore
import schemaDefinitions from "../../assets/fhir-definitions.schema.json5";
// @ts-ignore
import vsSchema from "../../assets/value-set-fields-layout.json5";
// @ts-ignore
import flLayout from "../../assets/fl-fields-layout.json5";
// @ts-ignore
import ilLayout from "../../assets/items-layout.json5";
// @ts-ignore
import extLayout from "../../assets/extension-fields-layout.json5";
// @ts-ignore
import vsLayout from "../../assets/value-set-fields-layout.json5";
import {ISchema} from "@lhncbc/ngx-schema-form";
import {JSONPath} from "jsonpath-plus";
import {JsonPointer} from "json-ptr";

export type PageType = 'FORM_LEVEL' | 'ITEM_LEVEL' | 'EXTENSION' | 'VALUE_SET';

export interface PageSchema {
  schema: ISchema,
  layout: any,
}

export type PageInfo = Record<PageType, PageSchema>;
export const patternToFHIRPrimitiveType = {
  "^(\\s*([0-9a-zA-Z\\+/=]){4}\\s*)+$": "base64Binary",
  "^true|false$": "boolean",
  // "^\\S*$": "canonical", // canonical, uri, and url are identical
  "^[^\\s]+(\\s[^\\s]+)*$": "code",
  "^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1]))?)?$": "date",
  "^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1])(T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\\.[0-9]+)?(Z|(\\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00)))?)?)?$": "dateTime",
  "^-?(0|[1-9][0-9]*)(\\.[0-9]+)?([eE][+-]?[0-9]+)?$": "decimal",
  "^[A-Za-z0-9\\-\\.]{1,64}$": "id",
  "^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\\.[0-9]+)?(Z|(\\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00))$": "instant",
  "^-?([0]|([1-9][0-9]*))$": "integer",
  // "^[ \\r\\n\\t\\S]+$": "markdown", // Markdown and string are identical.
  "^urn:oid:[0-2](\\.(0|[1-9][0-9]*))+$": "oid",
  "^[1-9][0-9]*$": "positiveInt",
  "^[ \\r\\n\\t\\S]+$": "string", // Markdown and string are identical.
  "^([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\\.[0-9]+)?$": "time",
  "^[0]|([1-9][0-9]*)$": "unsignedInt",
  // "^\\S*$": "uri", // canonical, uri, and url are identical
  "^\\S*$": "url", // canonical, uri, and url are identical
  "^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$": "uuid",
}

@Injectable({
  providedIn: 'root'
})
export class SchemaService {
/*
  pageInfo: PageInfo = {
    FORM_LEVEL: {
      schema: flSchema,
      layout: flLayout
    },
    ITEM_LEVEL: {
      schema: ilLayout,
      layout: ilLayout,
    },
    EXTENSION: {
      schema: schemaDefinitions.Extension,
      layout: extLayout,
    },
    VALUE_SET: {
      schema: vsLayout,
      layout: vsLayout,
    }
  };

*/
  // valueXCategories: string[];
  _valueXCategoryMap: {};
  primitiveFHIRTypeToWidgetMap = {
    base64Binary: 'textarea',
    boolean: 'boolean',
    canonical: 'url',
    code: 'string',
    date: 'date',
    dateTime: 'dateTime',
    decimal: 'number',
    id: 'string',
    instant: 'time',
    integer: 'integer',
    oid: 'string',
    markdown: 'textarea',
    positiveInt: 'integer',
    string: 'string',
    unsignedInt: 'integer',
    time: 'time',
    uri: 'url',
    url: 'url',
    uuid: 'string',
  };

  setValueXCategoryMap(extSchema: ISchema) {
    const valueXCategories = extSchema.properties.__$valueTypeCategory.enum.filter(el => el);
    const typeCategoryMap = {};
    const valueXArray = Object.keys(extSchema.properties).filter(key => key.startsWith('value'));
    (valueXArray || []).forEach((valueX) => {
      typeCategoryMap[valueX] = valueXCategories.find((cat) => {
        return extSchema.properties[cat].enum.includes(valueX);
      });
    });

    this._valueXCategoryMap = typeCategoryMap;
  }

  get valueXCategoryMap(): {} {
    return this._valueXCategoryMap;
  }

/*
  overrideSchemaWidgetsForFormLevelFields() {
    this.overrideSchemaWidgetsFromLayout(this.pageInfo.FORM_LEVEL.schema, this.pageInfo.FORM_LEVEL.layout);
  }

  overrideSchemaWidgetsForItemLevelFields() {
    this.overrideSchemaWidgetsFromLayout(this.pageInfo.ITEM_LEVEL.schema, this.pageInfo.ITEM_LEVEL.layout);
  }

  overrideSchemaWidgetsForVSFields() {
    this.overrideSchemaWidgetsFromLayout(this.pageInfo.VALUE_SET.schema, this.pageInfo.VALUE_SET.layout);
  }

  overrideSchemaWidgetForExtFields() {
    this.overrideSchemaWidgetsFromLayout(this.pageInfo.EXTENSION.schema, this.pageInfo.EXTENSION.layout);
  }
*/
  /**
   * Override schema.widget with widget definitions from layout.
   * @param schema - Schema object typically from *-schema.json file.
   * @param widgets - widgets definitions from layout files.
   * @param widgetsMap - An object mapping widget type to list of json pointers to select fields in schema. The selected field's widget
   *   definition is replaced with widget definitions from the layout.
   *   See src/assets/*layout.json5 and src/assets/*schema.json5 files for more information.
   */
  overrideSchemaWidgetsFromLayout(schema, {widgets, widgetsMap}) {
    if(!widgetsMap || !widgets) {
      return;
    }

    Object.keys(widgetsMap).forEach((widgetType) => {
      const widgetInfo = widgets[widgetType];
      if(widgetInfo) {
        const fieldJsonPaths: string[] = widgetsMap[widgetType];
        fieldJsonPaths?.forEach((path) => {
          const pointers = JSONPath({path, json: schema, resultType: 'pointer'});
          pointers.forEach((ptr: string) => {
            const fieldSchema: any = JsonPointer.get(schema, ptr);
            if(fieldSchema) {
              fieldSchema.widget = widgetInfo;
            }
          });
        });
      }
    });
  }

  /**
   *
   * @param schema
   * /
  addWidgetsByValueType(schema: ISchema) {
    const thisService = this;
    jsonTraverse(schema).forEach(function (node) {
      this.before(function () {
        const type = Util.extractFhirType('value', this.key);
        // Map data types to widget ids.
        if(type) {
          thisService.addDefaultWidgets(node as ISchema, thisService.pageInfo.EXTENSION.layout);
        }
      });
    });
  }
    */

  /**
   *
   * @param schema
   * @param layout
   */

  addDefaultWidgets(schema: ISchema, layout: any) {
    const thisService = this;
    jsonTraverse(schema).forEach(function (node) {
      const type = node && !node.type && node.properties ? 'object' : node?.type;
      if(type) {
        node.type = type;
      }
      this.post(function () {
        // Constraint to schema nodes that are children of root, properties or items.
        if(node && !node.widget && node.type && (this.parent === undefined || this.parent.key === 'properties' || this.key === 'items')) {
          // If there is no widget defined, add the default widget based on the schema type.
          let widgetType = layout.schemaTypeWidgetMap[node.type];
          // If the node has a pattern that matches a FHIR primitive type, use that widget instead.
          if(node.type === 'string' && node.pattern) {
            const fhirType = patternToFHIRPrimitiveType[node.pattern];
            if(fhirType) {
              widgetType = thisService.primitiveFHIRTypeToWidgetMap[fhirType] || widgetType;
            }
          }
          // If the node is enum, use select widget for string, number, or integer types.
          if((node.type === 'string' || node.type === 'number' && node.type === 'integer') && node.enum?.length) {
            widgetType = 'select';
          } else if(node.type === 'array' && node.items) {
            // If the node is an array, use table widget.
            widgetType = 'array';
          }
          let widget = widgetType ? layout.widgets[widgetType] : null;
          if(widget) {
            widget = JSON.parse(JSON.stringify(widget)); // Copy the widget.
            // Special handling for array type.
            if(this.parent?.node?.type === 'array') {
              // For array items, do not show the label. The label is item index used in the template
              widget.labelClasses = 'd-none';
              widget.nolabel = true;
              widget.labelPosition = 'top'; // To avoid left side label indent.
              widget.controlClasses = 'col-sm-12 p-0 m-0'; // Full width control.
            }
            if(widget.id === 'select' && widget.addEmptyOption && node.enum) {
              node.enum.unshift('');
            }

            if(this.key !== 'items') { // Do not set title for array items.
              node.title = node.title || Util.titleFromCamelCase(this.key);
            }
            node.widget = widget;
            this.update(node, true);
          }
        }
      });
    });
  }
}
