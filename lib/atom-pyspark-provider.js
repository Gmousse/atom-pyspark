'use babel';
import suggestions from '../completions.json';

export default class AtomPySparkProvider {

    constructor() {
        this.selector = '.source.python';
        this.filterSuggestions = false;
        this.inclusionPriority = 2;
        this.excludeLowerPriority = false;
    }

    _defineAvailableTypes(line) {
        if (line.includes('.')) {
            return ['method', 'value'];
        }
        return ['variable', 'constant', 'function', 'class', 'snippet', 'import'];
    }

    _isASubpackageImport(suggestion) {
        if (suggestion.displayText.includes('.') && !['method', 'value'].includes(suggestion.type)) {
            return true;
        }
        return false;
    }

    _getLastElementAfterSplit(stringToSplit, separator) {
        const splittedString = stringToSplit.split(separator);
        return splittedString[splittedString.length - 1];
    }

    _filterSuggestionsByTypes(line) {
        const availableTypes = this._defineAvailableTypes(line);
        return suggestions.PySpark.filter(
            suggestion => availableTypes.includes(suggestion.type) //|| this._isASubpackageImport(suggestion))
        );
    }

    _cleanCurrentLine(line) {
        const currentLine = this._getLastElementAfterSplit(line, ' ');
        return this._getLastElementAfterSplit(currentLine, '=');
    }

    _shouldBeSuggested(suggestion, line) {
        const cleanedLine = this._getLastElementAfterSplit(line, '.').toLowerCase();
        const isMatchingText = suggestion.text.toLowerCase().includes(cleanedLine);
        const isMatchingDisplayText = suggestion.displayText.toLowerCase().includes(cleanedLine);
        return isMatchingText && isMatchingDisplayText;
    }

    _isDuplicated(completions, suggestion) {
        return completions.filter(completion => completion.text === suggestion.text).length > 0;
    }

    _orderCompletions(completions, line) {
        const similarity = (completion) => {
            completion.similarity = line.length / completion.text.split('#?').join('').length;
            return completion;
        };
        const desc = (a, b) => b.similarity - a.similarity;
        return completions.map(similarity).sort(desc);
    }

    getSuggestions(atomParameters) {
        const { bufferPosition, editor } = atomParameters;
        const line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
        return this.getCompletions(line);
    }

    onDidInsertSuggestion({editor, triggerPosition, suggestion}) {
        if (suggestion.text.includes('#?')) {
            const line = editor.lineTextForBufferRow(triggerPosition.row);
            const replacement = line.split('#?').join('');
            editor.setTextInBufferRange([[triggerPosition.row, 0], [triggerPosition.row, line.length]], replacement);
        }
    }

    getCompletions(line) {
        const completions = [];
        const filteredSuggestions = this._filterSuggestionsByTypes(line);
        const currentLine = this._cleanCurrentLine(line);

        for (const suggestion of filteredSuggestions) {
            if (this._shouldBeSuggested(suggestion, currentLine)) {
                if (this._isDuplicated(completions, suggestion)) {
                    suggestion.text += '#?';
                }
                completions.push(Object.assign({}, suggestion));
            }
        }
        return this._orderCompletions(completions, currentLine);
    }
}
