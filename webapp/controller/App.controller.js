sap.ui.define(["./BaseController"], (BaseController) => {
  "use strict";

  return BaseController.extend("listaordini.controller.App", {
    onInit() {},

    onMenuSelect: function (oEvent) {
      const sKey = oEvent.getParameter("item").getKey();
      this.navTo(sKey);
    },
  });
});
