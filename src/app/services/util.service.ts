import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilService {

  constructor() { }

  traverse(collection, cb) {
    if (Array.isArray(collection)) {
      for (const item of collection) {
        if (typeof item === 'object') {
          this.traverse(item, cb);
        }
      }
    } else if (typeof collection === 'object') {
      for (const key in collection) {
        if (collection.hasOwnProperty(key)) {
          cb(collection, key, collection[key]);
          if (typeof collection[key] === 'object') {
            this.traverse(collection[key], cb);
          }
        }
      }
    }
  }

  processLayout(layout) {
    this.traverse(layout, (parent, key, value) => {
      if (key === 'condition' && typeof value === 'string') {
        let script = value;
        if (script.search(/\breturn\b/) < 0) {
          script = 'return ' + value;
        }
        try {
          const dynFn = new Function('model', script);
          parent[key] = dynFn;
        } catch (e) {
          console.error('condition functionBody errored out on evaluation: ' + value);
        }

      }
    });
  }
}
