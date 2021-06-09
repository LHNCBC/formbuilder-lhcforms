const jp = require("json-pointer");
const path = require("path");
const traverse = require("traverse");

if (process.argv.length < 3) {
  console.log("Usage: " + process.argv[0] + " " + process.argv[1] + " fhirSchemaFile");
  return;
}

const extCircularReferencedFields = new Set([
  'extension',
  'valueTiming',
  'valueDataRequirement',
  'valueTriggerDefinition',
  'valueDosage'
]);

let args = process.argv.slice(2);
let schema = require(path.resolve(process.cwd(), args[0]));
let fragment = jp(schema, '/definitions/Extension');
let newDefs = {};
const refs = new Set();

const removeFields = new Set([
  "contained",
  "ResourceList",
  "extension",
  "modifiedExtension"
]);

["/discriminator", "/oneOf"].forEach((ptr) => {
  jp.remove(schema, ptr);
});

// Collect all '$ref'
collectDefinitions(fragment); // Collected in refs.


refs.forEach(function(ptr) {
  let def = jp(schema, ptr);
  // type is missing for objects and z-schema doesn't like it.
  if (def.hasOwnProperty("properties") && !def.hasOwnProperty("type")) {
    def.type = "object";
  }
  jp(newDefs, ptr, def); // Collect definitions
});

// Address some z-schema complaints.
// Issues:
// 1) It mandates to have type field in all property definitions.
// 2) Does not recognize const keyword.
// 3) Complains about http protocol in uri spec for $schema and id fields.
// 4) Doesn't recognize $ref at root level.

// Remove $schema and id to calm down z-schema!
delete schema.$schema;
delete schema.id;
schema.type = "object"; // Add type, another z-schema quirk?
// Deleting and adding moves the definitions to end of properties.
// Seems to follow insertion order. Is that javascript spec?
delete schema.definitions
schema.definitions = newDefs.definitions;

jp(schema, "/definitions/xhtml/$ref", "#/definitions/string");
addMissingFields(schema, ["type"]);
addMissingTitle(schema);
removeCircularReferenceFields(jp(schema, "/definitions/Extension/properties"));

// Remove extensions for now.
jp.set(schema, "/definitions/Coding/properties/id/widget/id", "hidden");
jp.set(schema, "/definitions/Coding/properties/version/widget/id", "hidden");
jp.set(schema, "/definitions/Extension/widget/id", "hidden");
jp.set(schema, "/definitions/Extension/properties/id/widget/id", "hidden");
hideExtensions(schema);
jp.remove(schema, "/properties/item");
jp.remove(schema, "/definitions/Questionnaire_Item");
jp.remove(schema, "/definitions/Reference/properties/identifier");
codingLayout(schema);
derefDefinitions(schema);

console.log(JSON.stringify(schema.definitions.Extension, null, 2)); // tslint:disable-line no-console

function codingLayout(schema) {
  jp.set(schema, "/definitions/Coding/widget", {id: "row-layout"});
  const fieldList = Object.keys(jp(schema, "/definitions/Coding/properties"));
  jp.set(schema, "/definitions/Coding/fieldsets", [{fields: fieldList, showFields: [{code: {col: 2}}, {system: {col: 6}}, {display: {col: 4}}]}]);
}

function collectDefinitions(def) {
  traverse(def).reduce(function(acc, n) {
    if (this.notRoot) {
      if (this.key.match(/^_/) || removeFields.has(this.key)) {
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

function hideExtensions(obj) {
  traverse(obj).forEach(function(x) {
    if ((this.key === "extension" || this.key === "modifierExtension") &&
        (this.parent === undefined || (this.parent && this.parent.key === "properties"))) {
      x.widget = {id: "hidden"};
      this.update(x);
    }
  });
}

function removeCircularReferenceFields(obj) {
  const keys = Object.keys(obj);
  keys.forEach((key) => {
    if (extCircularReferencedFields.has(key)) {
      delete obj[key];
    }
  });
}

function derefDefinitions(rootSchema) {
  for(const k in rootSchema.definitions) {
    deref(rootSchema, rootSchema.definitions[k]);
  }
}

/**
 * Dereference the $ref pointers, i.e replace the references to definitions with actual definition objects.
 * @param rootSchema
 * @param subSchemaObj
 * @returns {{description}|*}
 */
function deref(rootSchema, subSchemaObj) {
  if (subSchemaObj.$ref) {
//    console.log("$ref = " + subSchemaObj.$ref);
    let refSchema = jp(rootSchema, subSchemaObj.$ref.slice(1));
    delete subSchemaObj.$ref;
    let derefSchema = deref(rootSchema, refSchema);
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
        subSchemaObj.properties[prop] = deref(rootSchema, subSchemaObj.properties[prop]);
      }
    }
  } else if (subSchemaObj.type === "array") {
//    console.log("array title = " + subSchemaObj.title);
    subSchemaObj.items = deref(rootSchema, subSchemaObj.items);
  }

  return subSchemaObj;
}

