class BaseConverter {
    getName() {
        return this.constructor.name;
    }

    convert($element, $, walker) {
        this._doPreValidate($element, $, walker);
        return this._doConvert($element, $, walker);
    }

    _doPreValidate($element, $, walker) {
        // In case of any validation errors, it is expected that we throw MigrationError
    }

    _doConvert($element, $, walker) {
        throw new Error("Child Class should override this method");
    }
}

module.exports = BaseConverter;