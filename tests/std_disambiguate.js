dojo.provide("tests.std_disambiguate");

doh.register("tests.std_disambiguate", [
    function(){
        var test = new StdRhinoTest("disambiguate_BasedOnEtAlSubsequent");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("disambiguate_BasedOnSubsequentFormWithBackref");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("disambiguate_BaseNameCountOnFailureIfYearSuffixAvailable");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("disambiguate_DisambiguateCondition");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("disambiguate_GivennameExpandCrossNestedNames");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("disambiguate_GivennameNoShortFormInitializeWith");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("disambiguate_GivennameShortFormInitializeWith");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("disambiguate_GivennameShortFormNoInitializeWith");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("disambiguate_MinimalGivennameExpandMinimalNames");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("disambiguate_NoShortFormInitializeWith");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("disambiguate_RetainNamesOnFailureIfYearSuffixNotAvailable");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("disambiguate_ShortFormInitializeWith");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("disambiguate_ShortFormNoInitializeWith");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("disambiguate_YearSuffixAndSort");
        doh.assertEqual(test.result, test.run());
    },
]);
