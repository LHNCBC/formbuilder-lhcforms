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
// jp.remove(schema, "/definitions/Extension/properties/extension");
replaceValue(jp(schema, "/definitions/Extension/properties"));

// Remove extensions for now.
// jp.remove(schema, "/properties/extension");
// jp.remove(schema, "/properties/modifierExtension");
addOptions(jp(schema, "/definitions/Coding/properties/id"), {hidden: true});
addOptions(jp(schema, "/definitions/Coding/properties/version"), {hidden: true});
addOptions(jp(schema, "/properties/definition"), {hidden: true});
addOptions(jp(schema, "/properties/id"), {hidden: true});
jp(schema, "/properties/required/format", "checkbox");
jp(schema, "/properties/readOnly/format", "checkbox");
jp(schema, "/properties/repeats/format", "checkbox");
jp(schema, "/properties/enableBehavior/format", "radio");
hideExtensions(schema);
specifyTableFormat(jp(schema, "/properties/code"), 2);
specifyTableFormat(jp(schema, "/properties/answerOption"), 2);
// For item schema, remove recursive definition
jp.remove(schema, "/properties/item");
jp.remove(schema, "/definitions/Questionnaire_Item");
jp.remove(schema, "/definitions/Reference/properties/identifier");
adjustOrderOfDisplay(schema);
addInfoText(schema, schema);
setSkipLogic(schema);
schema.title = "Questionnaire Item";
console.log(JSON.stringify(schema, null, 2)); // tslint:disable-line no-console

function setSkipLogic(schema) {
  [
    {
      target: '/properties/maxLength',
      conditions: [
        {source: 'type', value: ['text', 'string']}
      ],
    },
    {
      target: '/properties/readOnly',
      conditions: [
        {source: 'type', value: ['text', 'string', 'boolean', 'integer', 'decimal', 'date', 
        'dateTime', 'time', 'url', 'choice', 'open-choice', 'referene', 
        'quantity', 'attachment']}
      ],
    },
    {
      target: '/properties/required',
      conditions: [
        {source: 'type', value: ['text', 'string', 'boolean', 'integer', 'decimal', 'date', 
        'dateTime', 'time', 'url', 'choice', 'open-choice', 'referene', 
        'quantity', 'attachment']}
      ],
    },
    {
      target: '/properties/repeats',
      conditions: [
        {source: 'type', value: ['text', 'string', 'boolean', 'integer', 'decimal', 'date', 
        'dateTime', 'time', 'url', 'choice', 'open-choice', 'referene', 
        'quantity', 'attachment']}
      ],
    },
    {
      target: '/properties/answerOption',
      conditions: [
        {source: 'type', value: ['choice', 'open-choice']}
      ],
    }
  ].forEach((skObj) => {
    let target = jp(schema, skObj.target);
    if(!target.options) {
      target.options = {};
    }
    let tOptions = target.options;
    if(!tOptions.dependencies) {
      tOptions.dependencies = {};
    }
    skObj.conditions.forEach((condition) => {
      tOptions.dependencies[condition.source] = condition.value;
    });
  });
  
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
      if (!x.options) {
        x.options = {};
      }
      x.options.hidden = true;
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

function addInfoText(schema, obj) {
  const descr = obj.description;
  if (descr) {
    addOptions(obj, {infoText: descr});
    delete obj.description;
  }
  if (obj.properties) {
    const keys = Object.keys(obj.properties);
    keys.forEach((key) => {
      addInfoText(schema, obj.properties[key]);
    });
  }
  else if(obj['$ref']) {
    const ref = obj['$ref'].slice(1);
 //   console.log('DOing '+ref);
    const refObj = jp(schema, ref);
    addInfoText(schema, refObj);
 //   console.log('Parsing '+JSON.stringify(refObj, null, 2));
  }
}

function adjustOrderOfDisplay( schemaObj ) {
  jp.set(schemaObj, "/properties/type/propertyOrder", 9);
  jp.set(schemaObj, "/properties/text/propertyOrder", 10);
  jp.set(schemaObj, "/properties/linkId/propertyOrder", 20);
  jp.set(schemaObj, "/properties/code/propertyOrder", 30);
  jp.set(schemaObj, "/properties/required/propertyOrder", 40);
  jp.set(schemaObj, "/properties/readOnly/propertyOrder", 50);
  jp.set(schemaObj, "/properties/repeats/propertyOrder", 60);
  jp.set(schemaObj, "/properties/maxLength/propertyOrder", 70);
  jp.set(schemaObj, "/properties/answerOption/propertyOrder", 80);
  jp.set(schemaObj, "/definitions/Coding/properties/code/propertyOrder", 10);
  jp.set(schemaObj, "/definitions/Coding/properties/system/propertyOrder", 20);
  jp.set(schemaObj, "/definitions/Coding/properties/display/propertyOrder", 30);
}
