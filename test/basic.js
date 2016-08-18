var tape = require("tape");
var schema = require("../index");

function Obj(extra) {
  schema(this, {
    id: "string",
    count: "number",
    created: "date",
    favNumbers: ["number"],
    name: "string",
    address: { line1: "string", line2: "number" },
    firstName: { 
       // getter / setter
      get: function() { return this.name.split(" ")[0] },
      set: function(first) { this.name = first+" "+this.name.split(" ").slice(1).join(" ") } 
    }
  });
  if (extra) for (k in extra) this[k] = extra[k];
}

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
  var o = new Obj({ id: "test" });

  t.ok(o, "we have object");

  o.name = "John Smith";
  t.equals(o.firstName, "John", "getter works");

  o.firstName = "Jeremy";
  t.equals(o.name, "Jeremy Smith", "setter works");

  t.end();
})

// TODO
// TODO
// MANY OTHER TESTS :) see https://github.com/Ivshti/linvodb3/blob/master/test/schema.test.js