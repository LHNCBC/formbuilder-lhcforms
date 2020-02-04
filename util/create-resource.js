const jp = require("json-pointer");
const path = require("path");
const traverse = require("traverse");

if (process.argv.length < 4) {
  console.log("Usage: " + process.argv[0] + " " + process.argv[1] + " sourceSchemaFile fragmentToExtract");
  return;
}

let args = process.argv.slice(2);
let schema = require(path.resolve(process.cwd(), args[0]));
let fragment = jp(schema, args[1]);
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
delete schema.$schema;
delete schema.id;
schema.type = "object"; // Add type, another z-schema quirk?
Object.assign(schema, fragment); // Assign the desired fragment to the root.
// Deleting and adding moves the definitions to end of properties.
// Seems to follow insertion order. Is that javascript spec?
delete schema.definitions;
schema.definitions = newDefs.definitions;

if (jp.has(schema, "/properties/resourceType")) {
  redefineConst(jp(schema, "/properties/resourceType"));
}
jp(schema, "/definitions/xhtml/$ref", "#/definitions/string");
jp.remove(schema, "/definitions/base64Binary/type");
jp(schema, "/definitions/base64Binary/$ref", "#/definitions/string");
addMissingFields(schema, ["type"]);
addMissingTitle(schema);
//addMissingTitle(schema.definitions.Questionnaire_Item);
addMissingTitle(schema.definitions.Questionnaire_EnableWhen);
addMissingTitle(schema.definitions.Questionnaire_AnswerOption);
addMissingTitle(schema.definitions.Questionnaire_Initial);
jp.remove(schema, "/definitions/Extension/properties/extension");
jp.remove(schema, "/properties/item");
jp.remove(schema, "/definitions/Questionnaire_Item");

console.log(JSON.stringify(schema, null, 2)); // tslint:disable-line no-console

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
