/**
 * A tool for form level schema to massage it before
 * using it in the application (this is not something that runs in the application).
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
  "/properties/item"
]);

removePtrs.forEach(function(ptr) {
  jp.remove(schema, ptr);
});

collectDefinitions(schema);

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
// Object.assign(schema, fragment); // Assign the desired fragment to the root.
// Deleting and adding moves the definitions to end of properties.
// Seems to follow insertion order. Is that javascript spec?
delete schema.definitions;
schema.definitions = newDefs.definitions;

jp(schema, "/definitions/xhtml/$ref", "#/definitions/string");
jp.remove(schema, "/definitions/base64Binary/type");
jp(schema, "/definitions/base64Binary/$ref", "#/definitions/string");
addMissingFields(schema, ["type"]);
addMissingTitle(schema);
// jp.remove(schema, "/definitions/Extension/properties/extension");
removeValueCoding(jp(schema, "/definitions/Extension/properties"));

// Remove extensions for now.
// jp.remove(schema, "/properties/extension");
jp.remove(schema, "/definitions/Extension/properties/extension");
jp.set(schema, "/definitions/Coding/properties/id/widget/id", "hidden");
jp.set(schema, "/definitions/Coding/properties/version/widget/id", "hidden");
hideExtensions(schema);
// For item schema, remove recursive definition
jp.remove(schema, "/definitions/Questionnaire_Item");
jp.remove(schema, "/definitions/Reference/properties/identifier");
schema = deref(schema, schema);
delete schema.definitions;
console.log(JSON.stringify(schema, null, 2)); // tslint:disable-line no-console

/**
 * Walk through schema and collect referred definitions in 'refs' variable.
 * Exclude unwanted fields listed in 'removeFields' variable.
 *
 * @param mainSchema
 */
function collectDefinitions(mainSchema) {
  traverse(mainSchema).reduce(function(acc, n) {
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


/**
 * The schema some times doesn't specify things like type, and title.
 * This infers the value based on other properties.
 *
 * @param obj - Schema object
 * @param fields - Missing fields. Supports only type and title for now.
 */
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


/**
 * Add missing title. The title is assumed from field name.
 *
 * @param obj - schema object
 */
function addMissingTitle(obj) {
  const objProp = obj.properties;
  Object.keys(objProp).forEach(function(key) {
    if (!objProp[key].title) {
      objProp[key].title = capitalize(key);
    }
  });
}


/**
 * Capitalize camel case string to title case.
 * @param str
 * @returns {*}
 */
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


/**
 * Hide extensions by default.
 *
 * @param obj - Schema object.
 */
function hideExtensions(obj) {
  traverse(obj).forEach(function(x) {
    if ((this.key === "extension" || this.key === "modifierExtension") &&
        (this.parent === undefined || (this.parent && this.parent.key === "properties"))) {
      x.widget = {id: "hidden"};
      this.update(x);
    }
  });
}


/**
 * Remove valueCoding from obj.
 * @param obj
 */
function removeValueCoding(obj) {
  const keys = Object.keys(obj);
  keys.forEach((key) => {
    if (key === 'valueCoding') {
      delete obj[key];
    }
  });
}


/**
 * Dereference the $ref from the schema, i.e replace $ref with actual schema definition it is referring to.
 *
 * @param schemaObj - Root schema Object
 * @param subSchemaObj - Sub schema requiring dereference
 * @returns {{description}|*} - Sub schema object after it is dereferenced.
 */
function deref(schemaObj, subSchemaObj) {
  if (subSchemaObj.$ref) {
//    console.log("$ref = " + subSchemaObj.$ref);
    let refSchema = jp(schemaObj, subSchemaObj.$ref.slice(1)); // Avoid reading '#'
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
