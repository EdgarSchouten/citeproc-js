/**
 * A Javascript implementation of the CSL citation formatting language.
 *
 * <p>A configured instance of the process is built in two stages,
 * using {@link CSL.Core.Build} and {@link CSL.Core.Configure}.
 * The former sets up hash-accessible locale data and imports the CSL format file
 * to be applied to the citations,
 * transforming it into a one-dimensional token list, and
 * registering functions and parameters on each token as appropriate.
 * The latter sets jump-point information
 * on tokens that constitute potential branch
 * points, in a single back-to-front scan of the token list.
 * This
 * yields a token list that can be executed front-to-back by
 * body methods available on the
 * {@link CSL.Engine} class.</p>
 *
 * <p>This top-level {@link CSL} object itself carries
 * constants that are needed during processing.</p>
 * @namespace A CSL citation formatter.
 */
dojo.provide("tests.std_nameattr");

doh.register("tests.std_nameattr", [
    function(){
        var test = new StdRhinoTest("nameattr_AndOnBibliographyInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_AndOnBibliographyInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_AndOnCitationInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_AndOnCitationInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_AndOnNamesInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_AndOnNamesInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_AndOnStyleInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_AndOnStyleInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_DelimiterPrecedesLastOnBibliographyInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_DelimiterPrecedesLastOnBibliographyInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_DelimiterPrecedesLastOnCitationInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_DelimiterPrecedesLastOnCitationInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_DelimiterPrecedesLastOnNamesInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_DelimiterPrecedesLastOnNamesInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_DelimiterPrecedesLastOnStyleInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_DelimiterPrecedesLastOnStyleInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_EtAlMinOnBibliographyInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_EtAlMinOnBibliographyInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_EtAlMinOnCitationInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_EtAlMinOnCitationInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_EtAlMinOnNamesInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_EtAlMinOnNamesInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_EtAlMinOnStyleInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_EtAlMinOnStyleInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_EtAlSubsequentMinOnBibliographyInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_EtAlSubsequentMinOnBibliographyInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_EtAlSubsequentMinOnCitationInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_EtAlSubsequentMinOnCitationInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_EtAlSubsequentMinOnNamesInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_EtAlSubsequentMinOnNamesInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_EtAlSubsequentMinOnStyleInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_EtAlSubsequentMinOnStyleInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_EtAlSubsequentUseFirstOnBibliographyInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_EtAlSubsequentUseFirstOnBibliographyInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_EtAlSubsequentUseFirstOnCitationInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_EtAlSubsequentUseFirstOnCitationInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_EtAlSubsequentUseFirstOnNamesInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_EtAlSubsequentUseFirstOnNamesInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_EtAlSubsequentUseFirstOnStyleInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_EtAlSubsequentUseFirstOnStyleInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_EtAlUseFirstOnBibliographyInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_EtAlUseFirstOnBibliographyInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_EtAlUseFirstOnCitationInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_EtAlUseFirstOnCitationInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_EtAlUseFirstOnNamesInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_EtAlUseFirstOnNamesInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_EtAlUseFirstOnStyleInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_EtAlUseFirstOnStyleInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_InitializeWithOnBibliographyInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_InitializeWithOnBibliographyInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_InitializeWithOnCitationInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_InitializeWithOnCitationInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_InitializeWithOnNamesInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_InitializeWithOnNamesInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_InitializeWithOnStyleInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_InitializeWithOnStyleInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_NameAsSortOrderOnBibliographyInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_NameAsSortOrderOnBibliographyInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_NameAsSortOrderOnCitationInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_NameAsSortOrderOnCitationInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_NameAsSortOrderOnNamesInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_NameAsSortOrderOnNamesInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_NameAsSortOrderOnStyleInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_NameAsSortOrderOnStyleInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_NameDelimiterOnBibliographyInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_NameDelimiterOnBibliographyInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_NameDelimiterOnCitationInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_NameDelimiterOnCitationInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_NameDelimiterOnNamesInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_NameDelimiterOnNamesInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_NameDelimiterOnStyleInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_NameDelimiterOnStyleInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_NameFormOnBibliographyInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_NameFormOnBibliographyInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_NameFormOnCitationInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_NameFormOnCitationInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_NameFormOnNamesInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_NameFormOnNamesInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_NameFormOnStyleInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_NameFormOnStyleInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_NamesDelimiterOnBibliographyInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_NamesDelimiterOnBibliographyInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_NamesDelimiterOnCitationInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_NamesDelimiterOnCitationInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_NamesDelimiterOnNamesInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_NamesDelimiterOnNamesInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_NamesDelimiterOnStyleInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_NamesDelimiterOnStyleInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_SortSeparatorOnBibliographyInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_SortSeparatorOnBibliographyInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_SortSeparatorOnCitationInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_SortSeparatorOnCitationInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_SortSeparatorOnNamesInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_SortSeparatorOnNamesInCitation");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_SortSeparatorOnStyleInBibliography");
        doh.assertEqual(test.result, test.run());
    },
    function(){
        var test = new StdRhinoTest("nameattr_SortSeparatorOnStyleInCitation");
        doh.assertEqual(test.result, test.run());
    },
]);
