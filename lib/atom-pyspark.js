'use babel';

import AtomPySparkProvider from './atom-pyspark-provider.js';

class AtomPyspark {

    constructor() {
        this.provider = undefined;
    }

    activate() {
        this.provider = new AtomPySparkProvider();
    }

    desactivate() {
        this.provider = undefined;
    }

    getProvider() {
        return this.provider;
    }
}

export default new AtomPyspark();
