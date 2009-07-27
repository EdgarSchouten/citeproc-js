dojo.provide("tests.std_api");

doh.register("tests.std_api", [
    function(){
        var test = new StdRhinoTest("api_UpdateItemsDeleteDecrementsByCiteDisambiguation");
        doh.assertEqual(test.result, test.run());
    },
]);

var x = [
    function(){
        var test = new StdRhinoTest("api_UpdateItemsDelete");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("api_UpdateItemsReshuffle");
        doh.assertEqual(test.result, test.run());
    },
]