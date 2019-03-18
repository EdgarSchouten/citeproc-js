=============
`citeproc-js`
=============
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
A JavaScript implementation of the Citation Style Language
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

:Authors: Frank Bennett


.. image:: https://travis-ci.org/Juris-M/citeproc-js.svg?branch=master
   :target: https://travis-ci.org/Juris-M/citeproc-js

-----
About
-----

The `Citation Style Language <https://citationstyles.org/>`_ (CSL) is
an XML grammar for expressing the detailed requirements of a citation
style. A `CSL processor
<https://citationstyles.org/developers/#csl-processors>`_ is a tool
that generates citations and bibliographies by applying style rules
described in CSL to bibliographic data.

The ``citeproc-js`` CSL processor is over a decade in service, a fact
that shows through in ways both good and bad. On the downside, the
code base is not pretty, and can serve as a solid
illustration of the burden of technical debt (in case you need one of
those for your computer science class). On the upside, though,
``citeproc-js`` passes a suite of 1,400 integration tests with flying
colors. When run in CSL-M mode [1]_ it can handle multilingual and
legal content with a flexibility and precision unrivaled by any other
tool at any price. And it has been quite heavily field-tested, as the
citation formatter driving word processor integration in both
`Mendeley <https://www.mendeley.com/>`_ and `Zotero
<https://www.zotero.org/>`_.

More important than badges of popularity, though, is the CSL
standard. Developers can take comfort in the technical strength of the
`CSL Specification
<http://docs.citationstyles.org/en/1.0.1/specification.html>`_, and
the existence of `other processors
<https://citationstyles.org/developers/#csl-processors>`_ under active
development.  CSL is the modern way to handle bibliographic projects,
and ``citeproc-js`` is a convenient way to take advantage of it.

-----------
Quick Setup
-----------

The quickest way to install the processor is for use with Node.js, via `npm`::

    npm install citeproc

If you are working with the processor for the first time, running the
test suite is a good way to build confidence and begin exploring the
`documentation <https://citeproc-js.readthedocs.org/en/latest/index.html>`_.
Start by cloning the repo and its submodules::

    git clone --recursive https://github.com/Juris-M/citeproc-js.git

Then set up the test framework::

    cd citeproc-js
    npm install

You can now run the test script::
      
    node ./tests/runtests.js
  
This will return a help text about the test runner. Options``-a``, ``-g``, ``-s``, and ``-l`` should work out of the box::

    Error: Exactly one of -s, -g, -a, or -l must be invoked. No option found.
    
    Usage: runtests.js <-s testName|-g groupName|-a|-l> [-S styleName|-w cslFilePath|-C cslJsonFilePath]
      -s testName, --single=testName
          Run a single local or standard test fixture.
      -g groupName, --group=groupName
          Run a group of tests with the specified prefix.
      -a, --all
          Run all tests.
      -l, --list
          List available groups and styles.
      -c, --cranky
          Validate CSL in selected fixtures
      For style development (may be used with -s, -g, or -a):
        -S, --style
            Style name (without spaces). Requires also -w.
        -w, --watch
            Path to CSL source file watch for changes. Requires also -S.
        -C, --compose-tests
            Path to CSL JSON file containing item data. Requires also -S.
            Creates boilerplate test fixtures in -S style test directory.
            Existing files will be overwritten: be sure to rename files
            after generating boilerplate.
        -k, --key-query
            When tests fail, stop processeing and ask whether to adopt
            the processor output as the RESULT. Useful for rapidly
            back-fitting tests to existing styles.
        

----------
Watch mode
----------

The ``runtests.js`` script supports a simple but powerful "watch" mode
to support style development. In the scenario below, we will prepare
tests for the Journal Irreproducible Results (JIR). The journal
`exists <http://www.jir.com/>`_, but as there is no CSL style for it
in the CSL Repository, our tutorial will be largely devoid of
screenshots. The steps, however, can be applied to any style that
actually does exist.

**Requirements**
    * A recent-ish version of ``node.js``
    * Java (a basic command-line install, needed for validation)
    
I'll begin by forking the ``citeproc-js`` GitHub repository. This
will make it easy to fold my tests back into the main project ...


    .. image:: https://juris-m.github.io/citeproc-js/fork.png

... and then I will clone a local copy of my forked ``citeproc-js``
repository (not the Juris-M original)::

    git clone --recursive git://github.com/fbennett/citeproc-js.git

I will do two things in preparation for work on the JIR style:

  * Prepare a rough copy of the style (if it resembles another
    style, I might just fetch a copy of that, and change its
    title and ID);
  * Prepare a small collection of items in Zotero for use in
    testing the style, and export the full set of items
    to a file, in CSL JSON format.

I am now ready to begin working with the ``runtests.js`` script.
The first step is to generate ``citeproc`` test fixtures for
each of the exported library items. ``runtests.js`` can do
this for me, with options like the following::

  node ./tests/runtests.js \
       -C path/to/exported-items.json \
       -S journal-of-irreproducible-results
  
I now have a set of boilerplate tests that will fail miserably,
but those that pass can be quickly converted to passing
tests, using the ``-k`` option like this::

  node ./tests/runtests.js \
       -S journal-of-irreproducible-results \
       -w ../jm-styles/apa.csl \
       -a \
       -k

The output will look something like this:

.. image:: https://juris-m.github.io/citeproc-js/style-fail.png

If I respond to the prompt with ``Y``, the output of the style
will be adopted as the RESULT of the test fixture. If I respond
with ``N``, the fixture will be skipped, and the next test will
be shown, until the test set is exhausted.

The test fixtures are located in plain text files in a ``styletests``
subdirectory, where they can be edited directly::

  ./tests/styletests/journal-of-irreproducible-results
  
The ``-C`` option that generates the boilerplate is destructive—it
will overwrite existing files—so be sure to rename the files after
populating the directory.

Unlike the fixtures used to test the processor, style fixtures do not
contain a ``CSL`` section, because the CSL code of the target style
will be used.  Once I have prepared a full set of passing tests, I can
set the script to watch them when making further changes to the style.
The command for that is the same as for rapid editing, but without the
``-k`` option.::
  
  node ./tests/runtests.js \
       -S journal-of-irreproducible-results \
       -w ../jm-styles/apa.csl \
       -a
 
Each time I save the CSL file, the style code will be validated
before tests are run. Validation failures look like this:

.. image:: https://juris-m.github.io/citeproc-js/validation-fail.png

When I am happy with my tests, I can check them in to my local
``git``, push them to my GitHub repository, and file a pull request
to the ``Juris-M/citeproc-js`` master for general use by others
editing the style.
           
Done.

---------------------------

.. [1] CSL-M is set of private extensions to official CSL used by the
       `Jurism <https://juris-m.github.io>`_ reference manager, a
       variant of Zotero.

| 2019.03.17
| FB
