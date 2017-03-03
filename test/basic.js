var tape = require("tape");
var schema = require("../index");

var SCHEMA = {
  id: { type: "string", default: "foobar" },
  count: { type: "number", default: 2 },
  created: { type: "date" },
  favNumbers: { type: "array", schema: { type: "number" } },
  name: { type: "string" },
  address: { type: "object", schema: { line1: { type: "string" }, line2: {type: "number" } } },
  rName: { type: /^j(.*)y$/i }, // regex-based validation
  firstName: { 
     // getter / setter
    get: function() { return this.name.split(" ")[0] },
    set: function(first) { this.name = first+" "+this.name.split(" ").slice(1).join(" ") } 
  }
}

function Obj(extra, opts) {
  // WARNING: when using typed-schema in production, it's recommended that you assign values after calling schema(), but this is done so that we test the 'before' case too
  if (extra) for (k in extra) this[k] = extra[k];

  schema(this, SCHEMA, opts);
}

tape("schema default values", function(t) {
  var o = new Obj({ });

  t.ok(o, "we have object");

  t.equal(o.count, 2, "default value works for number");
  t.equal(o.id, "foobar", "default value works for string");

  t.end();
})

tape("schema enforcing number", function(t) {
  var o = new Obj({ id: "test", count: 5 });

  t.ok(o, "we have object");

  o.count = "shit";
  t.equal(o.count, 5, "assigning wrong type should fail");

  o.count = "7"
  t.equal(o.count, 7, "assigning castable value should work");

  t.end();
})

tape("schema enforcing string", function(t) {
  var o = new Obj({ id: 7 });

  t.ok(o, "we have object");

  t.equal(o.id, "7", "value from before calling schema() was also cast");

  o.id = 5;
  t.equal(o.id, "5", "should equal, and be the same type");

  t.end();
})

tape("schema enforcing number - no NaNs", function(t) {
  var o = new Obj({  });

  t.ok(o, "we have object");

  t.equal(o.count, 2);

  o.count = NaN;
  t.equal(o.count, 2, 'not changed when we try setting to NaN');

  o.count = 5;
  t.equal(o.count, 5);

  t.end();
})

tape("schema enforcing date", function(t) {
  var o = new Obj({ id: "test" });

  t.ok(o, "we have object");

  o.created = "2014-01-01";
  t.equal(o.created.getTime(), new Date("2014-01-01").getTime(), "same date");

  t.end();
})

tape("schema - sub-object", function(t) {
  var o = new Obj({ id: "test" });

  t.ok(o, "we have object");

  o.address.line1 = 17;
  t.equals(o.address.line1, "17", "casts strings in sub-object");

  o.address.line2 = "18";
  t.equals(o.address.line2, 18, "casts numbers in sub-object");

  t.end();
})

tape("schema arrays", function(t) {
  var o = new Obj({ id: "test" });

  t.ok(o, "we have object");

  o.favNumbers.push(22)
  o.favNumbers.push("42") // favNumbers will be [22, 42] ; the string will be cast to a number
  o.favNumbers.push("forty five") // nothing happens, can't cast "forty five" to number
  t.deepEquals(o.favNumbers, [22, 42], "expected behaviour on arrays");

  t.end();
})

tape("schema getter", function(t) {
  var o = new Obj({ id: "test", name: "Foo Bar" });

  t.ok(o, "we have object");

  t.equals(o.firstName, "Foo", "getter works with values before calling schema()");

  o.name = "John Smith";
  t.equals(o.firstName, "John", "getter works");

  o.firstName = "Jeremy";
  t.equals(o.name, "Jeremy Smith", "setter works");

  t.end();
})

tape("schema regex-based validation", function(t) {
  var o = new Obj({ id: "test" });

  t.ok(o, "we have object");

  o.rName = "Jay";
  t.equals(o.rName, "Jay", "regex-based validation allows compatible value");

  o.rName = "Jason";
  o.rName = "Foo";
  t.equals(o.rName, "Jay", "regex-based validation does not allow incompatible values");

  // Should this be expected behaviour?
  //o.rName = ["Jaimy"];
  //t.deepEquals(o.rName, ["Jaimy"], "regex-based validation works for arrays");

  t.end();
})


tape("schema onInvalidAssignment", function(t) {
  t.plan(3)

  var o = new Obj({ count: 7 }, { onInvalidAssignment: function(val, type) {
    t.ok(val === "kur", "we tried invalid value");
  }});
  t.ok(o, "we have object");
  t.equal(o.count, 7, "control value");
  o.count = "kur";
  
  t.end();
})

tape("schema onInvalidAssignment, on default", function(t) {
  t.plan(3)

  var o = new Obj({ count: 7 }, { onInvalidAssignment: function(val, type) {
    t.ok(val === "kur", "we tried invalid value");
  }});
  t.ok(o, "we have object");
  t.equal(o.count, 7, "control value");
  o.count = "kur";
  
  t.end();
})

tape("schema onInvalidAssignment, on initial value", function(t) {
  t.plan(2)

  var o = new Obj({ count: "kur" }, { onInvalidAssignment: function(val, type) {
    t.ok(val === "kur", "we tried invalid value");
  }});
  t.ok(o, "we have object");
  
  t.end();
})

tape("schema onInvalidAssignment, on default value", function(t) {
  t.plan(1)

  var o = { };
  schema(o, {
    id: { type: "number", default: "foobar" },
  }, { onInvalidAssignment: function(val, type) {
    t.ok(val === "foobar", "we tried invalid value as a default");
  }});
  
  t.end();
})

tape("schema onInvalidAssignment, on array", function(t) {
  t.plan(2)

  var o = new Obj({ id: "test" }, { onInvalidAssignment: function(val, type) {
    t.ok(val === "kur", "we tried invalid value");
  }});
  t.ok(o, "we have object");
  o.favNumbers.push("kur");
  o.favNumbers; // get, so we can run the validator

  t.end();
})



