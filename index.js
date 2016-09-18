/* We can pass an object as a spec which really describes a single type, and not a sub-object
 * e.g. { type: "string", index: true }
 * */
var specAllowedKeys = ["type", "index", "unique", "sparse", "default", "get", "set", "enumerable"];

function isComplexSpec(spec)
{
	return typeof(spec) == "object" && !Array.isArray(spec)
		&& Object.keys(spec).every(function(x) { return specAllowedKeys.indexOf(x) !== -1 });
};

function mapSpec(spec)
{
	if (spec === String) return "string";
	if (spec === Number) return "number";
	if (spec === Object) return "object";
	if (spec === Array) return "array";
	if (spec === Boolean) return "boolean";
	if (spec == Date) return "date";
	return spec;
};

// Allow for short-hands in schemas
// e.g. just "string" instead of { type: "string" }
function normalize(schema) {
	Object.keys(schema).forEach(function(key) {
		var spec = schema[key];
		if (isComplexSpec(spec)) { spec.type = mapSpec(spec.type); return; }
		else if (Array.isArray(spec)) schema[key] = { schema: mapSpec(spec[0]) || undefined, type: "array" };
		else if (typeof(spec) == "object") schema[key] = { schema: normalize(spec), type: "object" };
		else schema[key] = { type: mapSpec(spec) };
	});

	return schema;
};

function construct(self, schema, opts) {
	opts = opts || {}
	opts.onInvalidAssignment = opts.onInvalidAssignment || function() { }

	// Special case for arrays
	if (Array.isArray(self)) {
		var type = schema;
		if (! type) return self;

		var len = self.length;
		while (len--) {
			if (typeof(self[len])==type) continue;

			if (canCast(self[len], type)) self[len] = castToType(self[len], type);
			else self.splice(len, 1);
		};
		return self;
	};

	// Dynamic getter/setter for objects
	Object.keys(schema).forEach(function(key) {
		var spec = schema[key];
		
		if (spec.get || spec.set) {
			var val = self[key], hasVal = self.hasOwnProperty(key);
			Object.defineProperty(self, key, { get: spec.get, set: spec.set, enumerable: true });
			if (hasVal) self[key] = val; // call the setter the first time if we already had a set value
			return;
		}

		if (! spec.type) return; 

		var val;
		if (self.hasOwnProperty(key) && canCast(self[key], spec.type)) val = castToType(self[key], spec.type);
		else if (spec.hasOwnProperty("default") && canCast(spec.default, spec.type)) val = castToType(spec.default, spec.type);
		else val = defaultValue(spec.type);

		if (spec.schema) construct(val, spec.schema);

		Object.defineProperty(self, key, { 
			enumerable: true, 
			get: spec.type=="array" ? 
				function() { construct(val, spec.schema); return val } :
				function() { return val },
			set: function(v) {
				if (canCast(v, spec.type)) {
					var oldVal = val;
					val = castToType(v, spec.type);
					if (spec.schema && val!=oldVal) construct(val, spec.schema);
				} else {
					opts.onInvalidAssignment(v, spec.type);
				}
			}
		});
	});
	
	return self;
};


function canCast(val, spec)
{
	if (spec === true || spec=="mixed") return true;
	if (spec=="array" && Array.isArray(val)) return true;
	if (typeof(val) == spec) return true;
	if (spec == "string" && val && val.toString) return true;
	//if (spec == "regexp" && typeof(val))
	if (spec == "number" && !isNaN(val)) return true;
	if (spec == "date" && !isNaN(new Date(val).getTime())) return true;
	if (spec == "boolean" && !isNaN(val)) return true;
	if (spec.constructor.name === "RegExp" && val.toString && spec.test(val)) return true;
	return false;
};

function castToType(val, spec)
{
	if (spec===true || spec=="mixed") return val;
	if (spec=="array" && Array.isArray(val)) return val;	
	if (typeof(val) == spec) return val;
	if (spec == "string") return val.toString();
	if (spec == "number") return parseFloat(val);
	if (spec == "boolean") return !!val;
	if (spec == "date") return new Date(val);
	if (spec.constructor.name === "RegExp") return val.toString();
};

// TODO: copy from validate.js
function defaultValue(spec)
{
  if (spec.constructor.name === "RegExp") return "";
	return ({
		"string": "",
		"id": null,
		"number": 0,
		"boolean": false,
		"date": new Date(),
		"regexp": new RegExp(),
		"function": function() { },
		"array": [],
		"object": {}
	})[spec];
};

module.exports = function(self, schema, opts) {
	return construct(self, normalize(schema), opts);
};
