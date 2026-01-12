sap.ui.define(["sap/m/Input", "sap/m/InputRenderer"], function (Input, InputRenderer) {
  "use strict";

  return Input.extend("fpproject.controls.FloatInput", {
    metadata: {
      properties: {},
      events: {
        change: {}, // Espone l'evento change per l'utente
      },
    },

    init: function () {
      Input.prototype.init.apply(this, arguments);
      this.attachBrowserEvent("keypress", this._acceptOnlyFloat.bind(this));
      this.attachChange(this._onChangeHandler.bind(this)); // handler interno
    },

    renderer: InputRenderer,

    _acceptOnlyFloat: function (oEvent) {
      const key = oEvent.key;
      const value = oEvent.target.value;

      if (key === "," || (key === "." && value.includes(".")) || !/[\d.,]/.test(key)) {
        oEvent.preventDefault();
      }
    },

    _onChangeHandler: function (oEvent) {
      // Se l'utente ha definito un proprio handler 'change', lo chiamiamo e basta
      const aUserHandlers = this.mEventRegistry?.change || [];
      if (aUserHandlers.length > 1) {
        // Significa che l'utente ha collegato un handler custom (oltre il nostro interno)
        return;
      }

      let sValue = this.getValue().replace(",", "."); // Normalizza la virgola
      let fValue = parseFloat(sValue);

      if (!isNaN(fValue)) {
        fValue = parseFloat(fValue.toFixed(2)); // Arrotonda a due decimali
        this.setValue(fValue.toFixed(2)); // Mostra sempre due decimali

        // Aggiorna il binding del modello se presente
        const oBinding = this.getBinding("value");
        if (oBinding) {
          oBinding.setValue(fValue);
        }
      } else {
        this.setValue(0.0);
      }
    },
  });
});
