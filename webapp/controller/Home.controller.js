sap.ui.define(
  ["./BaseController", "sap/m/MessageToast", "sap/ui/model/json/JSONModel", "listaordini/model/formatter"],
  function (BaseController, MessageToast, JSONModel, formatter) {
    "use strict";

    return BaseController.extend("listaordini.controller.Home", {
      formatter: formatter,

      onInit: function () {
        this.getRouter().getRoute("Home").attachPatternMatched(this._onObjectMatched, this);
      },

      _onObjectMatched: function () {},
    });
  }
);
