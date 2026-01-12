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

    convertRecorsiveInUTCRome: function (oItem) {
      if (!oItem) {
        return oItem;
      }

      var bIsDate = oItem instanceof Date;
      var bIsObject = typeof oItem === "object" && !Array.isArray(oItem) && oItem !== null && !(oItem instanceof Date);
      var bIsArray = Array.isArray(oItem);

      if (bIsObject) {
        for (const property in oItem) {
          bIsObject =
            typeof oItem[property] === "object" &&
            !Array.isArray(oItem[property]) &&
            oItem[property] !== null &&
            !(oItem[property] instanceof Date);

          var bIsArray = Array.isArray(oItem[property]);

          if (bIsObject) {
            oItem[property] = this.convertRecorsiveInUTCRome(oItem[property]);
          }

          if (bIsArray) {
            oItem[property] = this.convertRecorsiveInUTCRome(oItem[property]);
          }

          if (oItem[property] instanceof Date) {
            oItem[property] = this.convertDateInUTCRome(oItem[property]);
          }
        }
      }

      if (bIsArray && oItem.length > 0) {
        oItem.map((oRecord, index) => {
          oItem[index] = this.convertRecorsiveInUTCRome(oRecord);
        });
      }

      if (bIsDate) {
        oItem = this.convertDateInUTCRome(oItem);
      }

      return oItem;
    },
  };
});
