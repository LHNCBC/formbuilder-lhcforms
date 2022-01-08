/**
 * A tool to adjust input schema for ngx-schema-form in a preprocessing step.
 *
 */
const jp = require("json-pointer");
const path = require("path");
const traverse = require("traverse");

if (process.argv.length < 3) {
  console.log("Usage: " + process.argv[0] + " " + process.argv[1] + " fhirSchemaFile");
  return;
}

let args = process.argv.slice(2);
let schema = require(path.resolve(process.cwd(), args[0]));
let fragment = jp(schema, '/definitions/Questionnaire_Item');
// schema.$ref = '#'+args[1];
let newDefs = {};
let refs = new Set();

const removeFields = new Set([
  "contained",
  "ResourceList",
]);
const removePtrs = new Set([
  "/discriminator",
  "/oneOf",
]);

removePtrs.forEach(function(ptr) {
  jp.remove(schema, ptr);
});

collectDefinitions(fragment);

refs.forEach(function(ptr) {
  let def = jp(schema, ptr);
  // type is missing for objects and z-schema doesn't like it.
  if (def.hasOwnProperty("properties") && !def.hasOwnProperty("type")) {
    def.type = "object";
  }
  jp(newDefs, ptr, jp(schema, ptr));
});

// Address some z-schema complaints.
// Issues:
// 1) It mandates to have type field in all property definitions.
// 2) Does not recognize const keyword.
// 3) Complains about http protocol in uri spec for $schema and id fields.
// 4) Doesn't recognize $ref at root level.

// Remove $schema and id to calm down z-schema!
//schema.$schema = "../../node_modules/ngx-schema-form/ngx-schema-form-schema.json";
delete schema.$schema;
delete schema.id;
schema.type = "object"; // Add type, another z-schema quirk?
Object.assign(schema, fragment); // Assign the desired fragment to the root.
// Deleting and adding moves the definitions to end of properties.
// Seems to follow insertion order. Is that javascript spec?
delete schema.definitions;
schema.definitions = newDefs.definitions;

jp(schema, "/definitions/xhtml/$ref", "#/definitions/string");
jp.remove(schema, "/definitions/base64Binary/type");
jp(schema, "/definitions/base64Binary/$ref", "#/definitions/string");
addMissingFields(schema, ["type"]);
addMissingTitle(schema);
//addMissingTitle(schema.definitions.Questionnaire_Item);
addMissingTitle(schema.definitions.Questionnaire_EnableWhen);
addMissingTitle(schema.definitions.Questionnaire_AnswerOption);
addMissingTitle(schema.definitions.Questionnaire_Initial);
// jp.remove(schema, "/definitions/Extension/properties/extension");
replaceValue(jp(schema, "/definitions/Extension/properties"));

// Remove extensions for now.
// jp.remove(schema, "/properties/extension");
jp.remove(schema, "/definitions/Extension/properties/extension");
jp.set(schema, "/definitions/Coding/properties/id/widget/id", "hidden");
jp.set(schema, "/definitions/Coding/properties/version/widget/id", "hidden");
hideExtensions(schema);
//specifyTableFormat(jp(schema, "/properties/code"), 2);
// For item schema, remove recursive definition
jp.remove(schema, "/properties/item");
jp.remove(schema, "/definitions/Questionnaire_Item");
jp.remove(schema, "/definitions/Reference/properties/identifier");
codingLayout(schema);
// addInfoText(schema);
//detectCircularRef(schema);
schema = deref(schema, schema);
//detectCircularRef(schema);
adjustLayout(schema);

console.log(JSON.stringify(schema, null, 2)); // tslint:disable-line no-console


/**
 * Overwrite default widget assignment.
 *
 * @param schema - Schema object
 */
function adjustLayout(schema) {
  const fieldsets = require('../src/assets/items-layout.json');
  // adjustOrderOfDisplay(schema);
  jp.set(schema, "/properties/type/widget", {id: 'select'});
  jp.set(schema, "/properties/enableBehavior/widget", {id: 'select'});
  jp.set(schema, "/fieldsets", fieldsets);
  jp.set(schema, "/properties/code/widget", {"id": "array-grid"});
  jp.set(schema, "/properties/definition/widget/id", "hidden");
  jp.set(schema, "/properties/id/widget/id", "hidden");
}

function codingLayout(schema) {
  jp.set(schema, "/definitions/Coding/widget", {id: "row-layout"});
  jp.set(schema, "/definitions/Coding/fieldsets", [{fields: ['id', 'extension', 'code', 'system', 'display', 'version', 'userSelected'], showFields: [{code: {col: 2}}, {system: {col: 6}}, {display: {col: 4}}]}]);
}

function collectDefinitions(def) {
  traverse(def).reduce(function(acc, n) {
    if (this.notRoot) {
      if ((this.key.match(/^_/) && (this.key !== '_text' || this.key !== '_prefix')) || removeFields.has(this.key)) {
        this.remove(true);
      } else if (this.key.match(/^\$ref/)) {
        const ref = n.slice(1);
        if (!acc.has(ref)) {
          acc.add(ref);
          collectDefinitions(jp(schema, ref));
        }
      }
    }
    return acc;
  }, refs);
}

function redefineConst(propertyDef) {
  if (propertyDef && propertyDef.const) {
    propertyDef.type = "string";
    propertyDef.enum = [propertyDef.const];
    delete propertyDef.const;
  }
}

function addMissingFields(obj, fields) {
  traverse(obj).forEach(function(n) {
    let thisContext = this;
    if (thisContext.notRoot) {
      let parent = thisContext.parent.node;
      fields.forEach(function(f) {
        if (!parent[f]) {
          switch (f) {
            case "type":
              if (parent.enum) {
                parent[f] = "string";
              } else if (parent.properties) {
                parent[f] = "object";
              }
              break;
            case "title":
              if (thisContext.parent && thisContext.parent.key) {
                parent.title = capitalize(thisContext.parent.key);
              }
              break;
          }
          thisContext.parent.update(parent);
        }
      });
    }
  });
}

function addMissingTitle(obj) {
  const objProp = obj.properties;
  Object.keys(objProp).forEach(function(key) {
    if (!objProp[key].title) {
      objProp[key].title = capitalize(key);
    }
  });
}

function capitalize(str) {
  return str.split(/(?<!^)([A-Z])/) // Don't split on the first char and retain the separators in the array.
    .map(function(word) {
      return word.replace(/^\w/, c => c.toLowerCase());
    })
    .reduce(function(acc, v, i) {
      if (i % 2) {
        acc += " ";
      }
      acc += v;
      return acc;
    }, "").replace(/^\w/, c => c.toUpperCase());
}

function addOptions(obj, opts) {
  if (!obj.options) {
    obj.options = {};
  }
  Object.assign(obj.options, opts);
}

function hideExtensions(obj) {
  traverse(obj).forEach(function(x) {
    if ((this.key === "extension" || this.key === "modifierExtension") &&
        (this.parent === undefined || (this.parent && this.parent.key === "properties"))) {
      x.widget = {id: "hidden"};
      this.update(x);
    }
  });
}

function replaceValue(obj) {
  const valueString = obj.valueString;
  const keys = Object.keys(obj);
  keys.forEach((key) => {
    if (key.startsWith("value")) {
      delete obj[key];
    }
  });
  obj.value = valueString;
}

function specifyTableFormat(obj, columns) {
  obj.format = "table";
//  addOptions(obj, {grid_columns: columns});
}

function addInfoText(obj) {
  const descr = obj.description;
  if (descr) {
    addOptions(obj, {infoText: descr});
    delete obj.description;
  }
  if (obj.properties) {
    const keys = Object.keys(obj.properties);
    keys.forEach((key) => {
      addInfoText(obj.properties[key]);
    });
  }
}

function adjustOrderOfDisplay( schemaObj ) {
  jp.set(schemaObj, "/order", ["type", "text", "linkId", "code", "required", "readOnly", "repeats", "maxLength"]);
  jp.set(schemaObj.definitions.Coding.properties, "/order", ["code", "system", "display"]);
}

function deref(schemaObj, subSchemaObj) {
  if (subSchemaObj.$ref) {
//    console.log("$ref = " + subSchemaObj.$ref);
    let refSchema = jp(schemaObj, subSchemaObj.$ref.slice(1));
    delete subSchemaObj.$ref;
    let derefSchema = deref(schemaObj, refSchema);
    if (subSchemaObj.title) {
      delete derefSchema.title;
    }
    if (subSchemaObj.description) {
      delete derefSchema.description;
    }
    Object.assign(subSchemaObj, derefSchema);
  } else if (subSchemaObj.type === "object") {
    for (let prop in subSchemaObj.properties) {
      if (subSchemaObj.properties.hasOwnProperty(prop)) {
//        console.log("object prop = " + prop);
        subSchemaObj.properties[prop] = deref(schemaObj, subSchemaObj.properties[prop]);
      }
    }
  } else if (subSchemaObj.type === "array") {
//    console.log("array title = " + subSchemaObj.title);
    subSchemaObj.items = deref(schemaObj, subSchemaObj.items);
  }

  return subSchemaObj;
}

function detectCircularRef(obj) {

  traverse(obj).forEach(function(n) {
//    console.log(this.path);
    if (this.circular) {
//      console.log("************" + this.path + "********************");
      this.remove();
    }
  });
}
