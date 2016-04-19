'use babel';

import AtomPySparkProvider from '../lib/atom-pyspark-provider';

let editor, provider;

function getCompletions(options = {}) {
    const cursor = editor.getLastCursor();
    const start = cursor.getBeginningOfCurrentWordBufferPosition();
    const end = cursor.getBufferPosition();
    const prefix = editor.getTextInRange([start, end]);
    const request = {
        editor,
        scopeDescriptor: cursor.getScopeDescriptor(),
        bufferPosition: end,
        prefix,
        activatedManually: options.activatedManually ? true : null,
    };
    return provider.getSuggestions(request);
}

beforeEach(() => {
    waitsForPromise(() => atom.packages.activatePackage('atom-pyspark'));
    waitsForPromise(() => atom.workspace.open('test.py'));
    runs(() => {
        provider = atom.packages.getActivePackage('atom-pyspark').mainModule.getProvider()
        editor = atom.workspace.getActiveTextEditor();
    });
    waitsFor(() => {
        return editor;
    })
});

describe('AtomPySparkProvider', () => {
    it('returns an array of completions', () => {
        const line = ''
        editor.setText(line)
        editor.setCursorBufferPosition([0, line.length])
        const completions = getCompletions()
        expect(Array.isArray(completions)).toBe(true)
    });

    it('returns an non-empty array of completions when a text is writted', () => {
        const line = 'SparkCont'
        editor.setText(line)
        editor.setCursorBufferPosition([0, line.length])
        const completions = getCompletions()
        expect(Array.isArray(completions) && completions.length > 0).toBe(true)
    });

    it('returns only methods or values / attributes if a . is writted', () => {
        const line = 'SparkContext.';
        editor.setText(line)
        editor.setCursorBufferPosition([0, line.length])
        const completions = getCompletions()
        const wrongTypeCompletions = completions.filter(completion => !['method', 'value'].includes(completion.type));
        expect(wrongTypeCompletions.length === 0).toBe(true)
    });

    it('doesnt return methods or values / attributes if a . is not writted', () => {
        const line = 'Spar';
        editor.setText(line)
        editor.setCursorBufferPosition([0, line.length])
        const completions = getCompletions()
        const wrongTypeCompletions = completions.filter(completion => ['method', 'value'].includes(completion.type));
        expect(wrongTypeCompletions.length === 0).toBe(true)
    });
});
