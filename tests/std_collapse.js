dojo.provide("tests.std_collapse");

dojo.require("csl.csl");

doh.register("tests.std_collapse", [
    function(){
        var test = CSL.System.Tests.getTest("collapse_CitationNumberRangesWithAffixes");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = CSL.System.Tests.getTest("collapse_YearSuffixCollapse");
        doh.assertEqual(test.result, test.run());
    },
]);
