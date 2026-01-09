sap.ui.define([], function () {
  "use strict";

  return {
    /**
     * Crea una copia profonda di un array (o oggetto) senza mantenere i riferimenti agli oggetti originali.
     *
     * Questa funzione utilizza `JSON.parse()` e `JSON.stringify()` per creare una copia profonda e
     * deserializza automaticamente qualsiasi stringa data (formato ISO 8601) in oggetti `Date`.
     *
     * @param {Array|Object} oArray L'array o l'oggetto da copiare.
     * @returns {Array|Object} Una copia profonda dell'array o dell'oggetto di input, con le date correttamente deserializzate.
     */
    copyWithoutRef: function (oArray) {
      /**
       * Funzione di supporto per deserializzare le stringhe di data in oggetti Date.
       *
       * @param {string} key La chiave della proprietà corrente in elaborazione.
       * @param {any} value Il valore della proprietà corrente in elaborazione.
       * @returns {any} Il valore deserializzato, con le stringhe di data convertite in oggetti Date.
       */
      function json_deserialize_helper(key, value) {
        if (typeof value === "string") {
          let regexp;
          regexp = /^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ$/.exec(value);
          if (regexp) {
            return new Date(value);
          }
        }
        return value;
      }

      return JSON.parse(JSON.stringify(oArray), json_deserialize_helper);
    },

    isObjectEmpty: function (oObj) {
      if (!oObj) {
        return true;
      }

      return Object.keys(oObj).length === 0 ? true : false;
    },
  };
});
