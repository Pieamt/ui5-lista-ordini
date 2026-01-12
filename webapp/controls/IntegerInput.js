sap.ui.define(["sap/m/Input", "sap/m/InputRenderer"], function (Input, InputRenderer) {
  "use strict";

  return Input.extend("listaordini.controls.IntegerInput", {
    metadata: {
      properties: {},
    },

    init: function () {
      Input.prototype.init.apply(this, arguments);
      this.attachBrowserEvent("keypress", this._acceptOnlyDigits.bind(this));
    },

    renderer: InputRenderer,

    _acceptOnlyDigits: function (oEvent) {
      const key = oEvent.key;

      if (!/^\d$/.test(key)) {
        oEvent.preventDefault();
      }
    },
  });
});
