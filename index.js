//var specAllowedKeys = ["type", "index", "unique", "sparse", "default", "get", "set", "enumerable"];

function construct(self, schema, opts) {
	opts = opts || {}

	function tryCast(val, type) {
		var can = canCast(val, type)
		if (!can && opts.onInvalidAssignment) opts.onInvalidAssignment(val, type);
		return can
	}

	// Special case for arrays
	if (Array.isArray(self)) {
		var type = schema.type;
		if (! type) return self;

		var len = self.length;
		while (len--) {
			if (typeof(self[len])==type) continue;

			if (tryCast(self[len], type)) self[len] = castToType(self[len], type);
			else self.splice(len, 1);
		};
		return self;
	};

	// Dynamic getter/setter for objects
	var key;
	for (key in schema) (function() { 
		var spec = schema[key];

		if (spec.get || spec.set) {
			var val = self[key], hasVal = self.hasOwnProperty(key);
			Object.defineProperty(self, key, { get: spec.get, set: spec.set, enumerable: true });
			if (hasVal) self[key] = val; // call the setter the first time if we already had a set value
			return;
		}

		if (! spec.type) return; 

		var val;
		if (self.hasOwnProperty(key) && tryCast(self[key], spec.type)) val = castToType(self[key], spec.type);
		else if (spec.hasOwnProperty("default") && tryCast(spec.default, spec.type)) val = castToType(spec.default, spec.type);
		else val = defaultValue(spec.type);

		if (spec.schema) construct(val, spec.schema, opts);

		if (opts.staticByDefault && !spec.dynamic) self[key] = val;
		else Object.defineProperty(self, key, { 
			enumerable: true, 
			get: spec.type=="array" ? 
				function() { construct(val, spec.schema, opts); return val } :
				function() { return val },
			set: function(v) {
				if (tryCast(v, spec.type)) {
					var oldVal = val;
					val = castToType(v, spec.type);
					if (spec.schema && val!=oldVal) construct(val, spec.schema, opts);
				}
			}
		});
	})(key);

	return self;
};


function canCast(val, spec)
{
	var type = typeof(val);

	if (type === spec && !(type === 'number' && isNaN(val))) return true; // NaN is unacceptable if we want a number

	if (spec === "string" && val && val.toString) return true;
	if (spec === "number" && !isNaN(parseFloat(val))) return true;
	if (spec === "boolean" && !isNaN(val)) return true;
	if (spec === "mixed") return true;
	if (spec === "array" && Array.isArray(val)) return true;
	//if (spec == "regexp" && typeof(val))
	if (spec === "date" && !isNaN(new Date(val).getTime())) return true;
	if (spec.constructor.name === "RegExp" && val.toString && spec.test(val)) return true;
	return false;
};

function castToType(val, spec)
{
	if (typeof(val) == spec) return val;
	if (spec === "string") return val.toString();
	if (spec === "number") return parseFloat(val);
	if (spec === "boolean") return !!val;
	if (spec === "date") return new Date(val);
	if (spec === "array" && Array.isArray(val)) return val;	
	if (spec === "mixed") return val;
	if (spec.constructor.name === "RegExp") return val.toString();
};


// TODO: copy from validate.js
function defaultValue(spec)
{
	if (spec === "string") return "";
	if (spec === "number") return 0;
	if (spec === "boolean") return false;
	if (spec === "date") return new Date();
	if (spec === "regexp") return new RegExp();
	if (spec === "array") return [];
	if (spec === "object") return {};
	if (spec.constructor.name === "RegExp") return "";
};

module.exports = function(self, schema, opts) {
	return construct(self, schema, opts);
};
