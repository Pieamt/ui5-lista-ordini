sap.ui.define(["sap/ui/core/format/DateFormat"], function (DateFormat) {
  "use strict";

  return {
    formatDateTime: function (sDate) {
      if (!sDate) return "";
      var oDate = new Date(sDate);
      var oFormat = DateFormat.getDateTimeInstance({
        pattern: "dd/MM/yyyy HH:mm",
      });
      return oFormat.format(oDate);
    },
  };
});
