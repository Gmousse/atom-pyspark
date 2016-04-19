'use strict';

class DocumentationToCompletionsParser {

    constructor(fileToParse) {
        this.file = fileToParse;
        this.completions = [];
    }

    _removeHTMLTags(htmlString) {
        return htmlString.replace(/<\/?[^>]+(>|$)/g, '').replace('\n');
    }

    _getName(htmlString) {
        const description = htmlString.split('\n')[1];
        return description.replace('<dt id="pyspark.', '').replace('">', '');
    }

    _getDescription(htmlString) {
        let description = htmlString.split('<p>')[1];
        const parameters = this._getParameters(htmlString);
        if (description) {
            description = description.split('</p>')[0];
            return `PARAMETERS: ${parameters}
             DESCRIPTION: ${this._removeHTMLTags(description)}`;
        }
    }

    _getParameters(htmlString) {
        let functionDescription = htmlString.split('(</big>');
        let parameters = '';
        if (functionDescription[1]) {
            functionDescription = functionDescription[1].split('<big>)');
            functionDescription.pop();
            parameters = this._removeHTMLTags(functionDescription.join(''));
        }
        return parameters;
    }

    _getSnippet(functionName, htmlString) {
        const parameters = this._getParameters(htmlString);
        return `${functionName}(${parameters})`;
    }

    _getText(type, name) {
        if (['function', 'method', 'class'].includes(type)) {
            return `${name.split('.').pop()}()`;
        }
        return name.split('.').pop();
    }

    _parseFunctions(functions) {
        functions.forEach(func => {
            const funcObject = {
                name: this._getName(func),
                type: 'function',
                description: this._getDescription(func),
                rightLabel: 'function | PySpark',
            };
            funcObject.displayText = this._getSnippet(funcObject.name, func);
            funcObject.text = this._getText(funcObject.type, funcObject.name);
            funcObject.leftLabel = funcObject.name;
            this.completions.push(funcObject);
        });
    }

    _parseClass(classes) {
        classes.forEach(classe => {
            const methods = classe.split('<dl class="method">');
            const attributes = classe.split('<dl class="attribute">');
            attributes.shift();
            const classDescription = methods[0];
            methods.shift();
            const classObject = {
                name: this._getName(classe),
                type: 'class',
                description: this._getDescription(classDescription),
                rightLabel: 'class | PySpark',
            };
            classObject.displayText = this._getSnippet(classObject.name, classDescription);
            classObject.text = this._getText(classObject.type, classObject.name);
            classObject.leftLabel = classObject.name;
            this.completions.push(classObject);

            this._parseAttributes(attributes, classObject.name);
            this._parseMethods(methods, classObject.name);
        });
    }

    _parseAttributes(attributes, className) {
        attributes.forEach(attribute => {
            const attributeObject = {
                name: this._getName(attribute),
                type: 'value',
                description: this._getDescription(attribute),
                leftLabel: className,
                rightLabel: 'attribute | PySpark',
            };
            attributeObject.displayText = attributeObject.name;
            attributeObject.text = this._getText(attributeObject.type, attributeObject.name.replace(`${className}.`, ''));
            this.completions.push(attributeObject);
        });
    }

    _parseMethods(methods, className) {
        methods.forEach(method => {
            const methodObject = {
                name: this._getName(method),
                type: 'method',
                description: this._getDescription(method),
                leftLabel: className,
                rightLabel: 'method | PySpark',
            };
            methodObject.displayText = this._getSnippet(methodObject.name, method);
            methodObject.text = this._getText(methodObject.type, methodObject.name);
            this.completions.push(methodObject);
        });
    }

    getCompletions() {
        const classes = this.file.split('<dl class="class">');
        classes.shift();
        const functions = this.file.split('<dl class="function">');
        functions.shift();
        this._parseClass(classes);
        this._parseFunctions(functions);
        return this.completions;
    }
}

module.exports = DocumentationToCompletionsParser;
